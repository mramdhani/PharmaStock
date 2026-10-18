import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Batch } from '../batches/entities/batch.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { StockQueryDto } from './dto/stock-query.dto';
import { MovementType, StockMovement } from './entities/stock-movement.entity';

@Injectable()
export class StockService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Helper untuk mendapatkan user valid untuk pencatatan audit trail.
   */
  private async resolveUser(userId?: string): Promise<User> {
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) return user;
    }

    // Fallback: gunakan user aktif pertama dari seeder jika belum ada JWT
    const defaultUser = await this.userRepository.findOne({
      where: { is_active: true },
      order: { created_at: 'ASC' },
    });

    if (!defaultUser) {
      throw new NotFoundException('Tidak ada akun user terdaftar untuk pencatatan transaksi');
    }

    return defaultUser;
  }

  /**
   * Transaksi Barang Masuk (Stock In):
   * 1. Mulai database transaction
   * 2. Kunci baris batch (Pessimistic Write Lock)
   * 3. Validasi status produk & tanggal expired
   * 4. Tambah current_stock pada batch
   * 5. Catat riwayat ke tabel stock_movements
   * 6. Commit transaction (Rollback jika terjadi error)
   */
  async recordStockIn(dto: StockInDto) {
    const user = await this.resolveUser(dto.user_id);
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Kunci baris batch (SELECT ... FOR UPDATE) pada tabel batches murni tanpa outer join
      const batch = await queryRunner.manager.findOne(Batch, {
        where: { id: dto.batch_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!batch) {
        throw new NotFoundException(
          `Batch dengan ID "${dto.batch_id}" tidak ditemukan`,
        );
      }

      // Validasi status produk
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: batch.product_id },
      });

      if (!product || !product.is_active) {
        throw new BadRequestException(
          'Tidak dapat menambah stok pada produk yang nonaktif',
        );
      }

      // Cek apakah batch sudah kedaluwarsa
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(batch.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate <= today) {
        throw new BadRequestException(
          'Tidak dapat menerima stok masuk untuk batch yang sudah kedaluwarsa',
        );
      }

      // 1. Tambah saldo stok batch
      batch.current_stock += dto.quantity;
      await queryRunner.manager.save(batch);

      // 2. Simpan buku besar (ledger) mutasi stok
      const movement = queryRunner.manager.create(StockMovement, {
        batch_id: batch.id,
        user_id: user.id,
        type: MovementType.IN,
        quantity: dto.quantity,
        reference_no: dto.reference_no ?? null,
        notes: dto.notes ?? null,
      });
      const savedMovement = await queryRunner.manager.save(movement);

      // Selesai transaksi (ACID Commit)
      await queryRunner.commitTransaction();

      return {
        type: MovementType.IN,
        quantity: dto.quantity,
        current_stock: batch.current_stock,
        movement: savedMovement,
      };
    } catch (err) {
      // Batalkan seluruh perubahan jika ada kegagalan
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // Lepaskan koneksi runner kembali ke pool
      await queryRunner.release();
    }
  }

  /**
   * Transaksi Barang Keluar (Stock Out):
   * 1. Mulai database transaction
   * 2. Kunci baris batch (Pessimistic Write Lock) -> cegah race condition
   * 3. Validasi obat expired (Dilarang mengeluarkan obat kedaluwarsa)
   * 4. Validasi kecukupan saldo stok (current_stock >= quantity)
   * 5. Kurangi current_stock pada batch
   * 6. Catat riwayat ke tabel stock_movements
   * 7. Commit transaction (Rollback jika terjadi error)
   */
  async recordStockOut(dto: StockOutDto) {
    const user = await this.resolveUser(dto.user_id);
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Kunci baris batch (SELECT ... FOR UPDATE) pada tabel batches murni tanpa outer join
      const batch = await queryRunner.manager.findOne(Batch, {
        where: { id: dto.batch_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!batch) {
        throw new NotFoundException(
          `Batch dengan ID "${dto.batch_id}" tidak ditemukan`,
        );
      }

      // 1. Larangan mengeluarkan obat expired
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(batch.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate <= today) {
        throw new ConflictException(
          'Ditolak: Tidak dapat mengeluarkan obat dari batch yang sudah kedaluwarsa',
        );
      }

      // 2. Cek kecukupan saldo stok
      if (batch.current_stock < dto.quantity) {
        throw new ConflictException(
          `Stok tidak mencukupi (Tersedia: ${batch.current_stock} unit, Diminta: ${dto.quantity} unit)`,
        );
      }

      // 3. Kurangi saldo stok
      batch.current_stock -= dto.quantity;
      await queryRunner.manager.save(batch);

      // 4. Catat riwayat transaksi
      const movement = queryRunner.manager.create(StockMovement, {
        batch_id: batch.id,
        user_id: user.id,
        type: MovementType.OUT,
        quantity: dto.quantity,
        reference_no: dto.reference_no ?? null,
        notes: dto.notes ?? null,
      });
      const savedMovement = await queryRunner.manager.save(movement);

      // Selesai transaksi (ACID Commit)
      await queryRunner.commitTransaction();

      return {
        type: MovementType.OUT,
        quantity: dto.quantity,
        remaining_stock: batch.current_stock,
        movement: savedMovement,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Mengambil buku besar riwayat pergerakan stok (Stock Ledger)
   * dengan pagination dan filter.
   */
  async findMovements(query: StockQueryDto) {
    const { page = 1, limit = 10, type, batch_id, product_id, search, skip } = query;

    const qb = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.batch', 'batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('movement.user', 'user')
      .orderBy('movement.created_at', 'DESC');

    if (type) {
      qb.andWhere('movement.type = :type', { type });
    }

    if (batch_id) {
      qb.andWhere('movement.batch_id = :batchId', { batchId: batch_id });
    }

    if (product_id) {
      qb.andWhere('batch.product_id = :productId', { productId: product_id });
    }

    if (search) {
      qb.andWhere(
        '(movement.reference_no ILIKE :search OR product.name ILIKE :search OR batch.batch_number ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
