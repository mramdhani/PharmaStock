import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { BatchQueryDto } from './dto/batch-query.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { Batch } from './entities/batch.entity';

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Helper untuk menghitung selisih hari menuju tanggal kedaluwarsa.
   */
  private calculateExpiryDetails(expiryDateStr: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(expiryDateStr);
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      days_until_expiry: diffDays,
      is_expired: diffDays <= 0,
    };
  }

  /**
   * Membuat batch baru untuk suatu produk.
   * Saldo awal SELALU 0. Stok hanya bertambah lewat transaksi Stock In.
   */
  async create(createBatchDto: CreateBatchDto): Promise<Batch> {
    // 1. Validasi produk
    const product = await this.productRepository.findOne({
      where: { id: createBatchDto.product_id },
    });

    if (!product) {
      throw new NotFoundException(
        `Produk dengan ID "${createBatchDto.product_id}" tidak ditemukan`,
      );
    }

    if (!product.is_active) {
      throw new BadRequestException(
        'Tidak dapat membuat batch untuk produk yang nonaktif',
      );
    }

    // 2. Validasi tanggal expired harus di masa depan
    const { is_expired } = this.calculateExpiryDetails(createBatchDto.expiry_date);
    if (is_expired) {
      throw new BadRequestException(
        'Tanggal kedaluwarsa (expiry_date) harus di masa depan',
      );
    }

    // 3. Validasi keunikan composite UNIQUE(product_id, batch_number)
    const existing = await this.batchRepository.findOne({
      where: {
        product_id: createBatchDto.product_id,
        batch_number: createBatchDto.batch_number,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Batch dengan nomor "${createBatchDto.batch_number}" sudah terdaftar untuk produk ini`,
      );
    }

    // 4. Simpan batch dengan saldo awal 0
    const batch = this.batchRepository.create({
      ...createBatchDto,
      current_stock: 0,
    });

    return this.batchRepository.save(batch);
  }

  /**
   * Mengambil daftar batch dengan filter pencarian, produk, saldo stok,
   * dan otomatis diurutkan berdasarkan FEFO (First Expired, First Out).
   */
  async findAll(query: BatchQueryDto) {
    const { page = 1, limit = 10, search, product_id, has_stock, skip } = query;

    const qb = this.batchRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('batch.expiry_date', 'ASC'); // Urutan FEFO default

    if (search) {
      qb.andWhere(
        '(batch.batch_number ILIKE :search OR product.name ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (product_id) {
      qb.andWhere('batch.product_id = :productId', { productId: product_id });
    }

    if (has_stock) {
      qb.andWhere('batch.current_stock > 0');
    }

    const [batches, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = batches.map((b) => ({
      ...b,
      ...this.calculateExpiryDetails(b.expiry_date),
    }));

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

  /**
   * Mengambil daftar batch yang mendekati tanggal kedaluwarsa (misal dalam 30 hari ke depan).
   * Digunakan untuk widget peringatan pada Dashboard.
   */
  async findExpiring(days: number = 30) {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + days);

    const todayStr = today.toISOString().split('T')[0];
    const targetStr = targetDate.toISOString().split('T')[0];

    const batches = await this.batchRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('batch.current_stock > 0') // Hanya cek batch yang masih bersaldo
      .andWhere('batch.expiry_date >= :today', { today: todayStr })
      .andWhere('batch.expiry_date <= :targetDate', { targetDate: targetStr })
      .orderBy('batch.expiry_date', 'ASC')
      .getMany();

    return batches.map((b) => ({
      ...b,
      ...this.calculateExpiryDetails(b.expiry_date),
    }));
  }

  /**
   * Mengambil detail satu batch lengkap dengan produk dan riwayat transaksi.
   */
  async findOne(id: string) {
    const batch = await this.batchRepository.findOne({
      where: { id },
      relations: {
        product: { category: true },
        stock_movements: { user: true },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch dengan ID "${id}" tidak ditemukan`);
    }

    return {
      ...batch,
      ...this.calculateExpiryDetails(batch.expiry_date),
    };
  }

  /**
   * Mengupdate nomor batch atau tanggal expired.
   */
  async update(id: string, updateBatchDto: UpdateBatchDto): Promise<Batch> {
    const batch = await this.batchRepository.findOne({ where: { id } });

    if (!batch) {
      throw new NotFoundException(`Batch dengan ID "${id}" tidak ditemukan`);
    }

    // Jika nomor batch diubah, cek keunikan
    if (
      updateBatchDto.batch_number &&
      updateBatchDto.batch_number !== batch.batch_number
    ) {
      const duplicate = await this.batchRepository.findOne({
        where: {
          product_id: batch.product_id,
          batch_number: updateBatchDto.batch_number,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Batch dengan nomor "${updateBatchDto.batch_number}" sudah ada untuk produk ini`,
        );
      }
    }

    // Jika expiry_date diubah, validasi
    if (updateBatchDto.expiry_date) {
      const { is_expired } = this.calculateExpiryDetails(updateBatchDto.expiry_date);
      if (is_expired) {
        throw new BadRequestException(
          'Tanggal kedaluwarsa baru harus di masa depan',
        );
      }
    }

    Object.assign(batch, updateBatchDto);
    return this.batchRepository.save(batch);
  }

  /**
   * Menghapus batch:
   * Hanya diizinkan jika batch belum memiliki riwayat transaksi dan saldo = 0.
   */
  async remove(id: string): Promise<void> {
    const batch = await this.batchRepository.findOne({
      where: { id },
      relations: { stock_movements: true },
    });

    if (!batch) {
      throw new NotFoundException(`Batch dengan ID "${id}" tidak ditemukan`);
    }

    if (batch.current_stock > 0) {
      throw new ConflictException(
        `Tidak dapat menghapus batch karena masih memiliki saldo stok (${batch.current_stock} unit)`,
      );
    }

    if (batch.stock_movements && batch.stock_movements.length > 0) {
      throw new ConflictException(
        'Tidak dapat menghapus batch yang memiliki riwayat pergerakan stok',
      );
    }

    await this.batchRepository.remove(batch);
  }
}
