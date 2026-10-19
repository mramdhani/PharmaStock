import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { Batch } from '../batches/entities/batch.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { MovementType, StockMovement } from '../stock/entities/stock-movement.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class SystemService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
  ) {}

  /**
   * Mengembalikan database demo ke state awal pabrik (factory reset).
   * Menjamin data demo selalu bersih dan tidak rusak oleh pengujian publik.
   */
  async resetDemoData() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const defaultPassword = await bcrypt.hash('PharmaStock123!', 10);

      // 1. Pastikan 3 Akun Demo ada dan password direset
      const demoUsers = [
        {
          name: 'System Administrator',
          email: 'admin@pharmastock.com',
          password_hash: defaultPassword,
          role: UserRole.ADMIN,
          is_active: true,
        },
        {
          name: 'Gudang Staff (Budi)',
          email: 'staff@pharmastock.com',
          password_hash: defaultPassword,
          role: UserRole.STAFF,
          is_active: true,
        },
        {
          name: 'Demo Public Viewer',
          email: 'viewer@pharmastock.com',
          password_hash: defaultPassword,
          role: UserRole.VIEWER,
          is_active: true,
        },
      ];

      const userMap = new Map<string, User>();
      for (const u of demoUsers) {
        let existing = await queryRunner.manager.findOne(User, {
          where: { email: u.email },
        });
        if (existing) {
          existing.password_hash = defaultPassword;
          existing.is_active = true;
          existing.role = u.role;
          existing.name = u.name;
          await queryRunner.manager.save(User, existing);
          userMap.set(u.email, existing);
        } else {
          const created = queryRunner.manager.create(User, u);
          const saved = await queryRunner.manager.save(User, created);
          userMap.set(u.email, saved);
        }
      }

      const staffUser = userMap.get('staff@pharmastock.com')!;

      // 2. Bersihkan tabel transaksional dan master
      await queryRunner.query('TRUNCATE TABLE stock_movements CASCADE;');
      await queryRunner.query('TRUNCATE TABLE batches CASCADE;');
      await queryRunner.query('TRUNCATE TABLE products CASCADE;');
      await queryRunner.query('TRUNCATE TABLE categories CASCADE;');

      // 3. Buat Kategori Standar
      const categoriesData = [
        { name: 'Antibiotik' },
        { name: 'Analgesik & Antipiretik' },
        { name: 'Kardiovaskular' },
        { name: 'Suplemen & Vitamin' },
        { name: 'Antihistamin' },
      ];

      const savedCategories: Record<string, Category> = {};
      for (const cat of categoriesData) {
        const c = queryRunner.manager.create(Category, cat);
        const saved = await queryRunner.manager.save(Category, c);
        savedCategories[cat.name] = saved;
      }

      // 4. Buat Master Produk
      const productsData = [
        {
          category_id: savedCategories['Antibiotik'].id,
          sku: 'MED-AMX-500',
          name: 'Amoxicillin Trihydrate 500mg',
          unit: 'Kapsul',
          minimum_stock: 100,
        },
        {
          category_id: savedCategories['Analgesik & Antipiretik'].id,
          sku: 'MED-PCT-500',
          name: 'Paracetamol 500mg Kaplet',
          unit: 'Tablet',
          minimum_stock: 200,
        },
        {
          category_id: savedCategories['Kardiovaskular'].id,
          sku: 'MED-CND-008',
          name: 'Candesartan Cilexetil 8mg',
          unit: 'Tablet',
          minimum_stock: 50,
        },
        {
          category_id: savedCategories['Suplemen & Vitamin'].id,
          sku: 'VIT-VTC-500',
          name: 'Vitamin C 500mg Buffered Non-Acidic',
          unit: 'Kaplet',
          minimum_stock: 150,
        },
        {
          category_id: savedCategories['Antihistamin'].id,
          sku: 'MED-CTZ-010',
          name: 'Cetirizine HCl 10mg',
          unit: 'Tablet',
          minimum_stock: 80,
        },
      ];

      const savedProducts: Record<string, Product> = {};
      for (const prod of productsData) {
        const p = queryRunner.manager.create(Product, prod);
        const saved = await queryRunner.manager.save(Product, p);
        savedProducts[prod.sku] = saved;
      }

      // 5. Buat Batch dengan variasi tanggal (Normal, Mendekati Kadaluwarsa, Saldo Menipis)
      const now = new Date();
      // Mendekati kadaluwarsa (45 hari ke depan)
      const nearExpiryDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      // Kadaluwarsa panjang (1.5 - 2 tahun ke depan)
      const futureDate1 = new Date(now.getTime() + 500 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const futureDate2 = new Date(now.getTime() + 720 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const batchesData = [
        {
          product_id: savedProducts['MED-AMX-500'].id,
          batch_number: 'BAT-AMX-2026A',
          expiry_date: futureDate1,
          current_stock: 150,
        },
        {
          product_id: savedProducts['MED-AMX-500'].id,
          batch_number: 'BAT-AMX-2025EXP',
          expiry_date: nearExpiryDate, // Alert mendekati kadaluwarsa!
          current_stock: 35,
        },
        {
          product_id: savedProducts['MED-PCT-500'].id,
          batch_number: 'BAT-PCT-202601',
          expiry_date: futureDate2,
          current_stock: 450,
        },
        {
          product_id: savedProducts['MED-CND-008'].id,
          batch_number: 'BAT-CND-2026X',
          expiry_date: futureDate1,
          current_stock: 30, // Stok di bawah minimum_stock 50 -> Alert Low Stock!
        },
        {
          product_id: savedProducts['VIT-VTC-500'].id,
          batch_number: 'BAT-VTC-20261',
          expiry_date: futureDate2,
          current_stock: 220,
        },
        {
          product_id: savedProducts['MED-CTZ-010'].id,
          batch_number: 'BAT-CTZ-20269',
          expiry_date: futureDate1,
          current_stock: 95,
        },
      ];

      const savedBatches: Batch[] = [];
      for (const batch of batchesData) {
        const b = queryRunner.manager.create(Batch, batch);
        const saved = await queryRunner.manager.save(Batch, b);
        savedBatches.push(saved);
      }

      // 6. Buat Riwayat Stock Movements (7 hari terakhir agar visualisasi chart langsung aktif)
      const movementsData = [
        {
          batch_id: savedBatches[0].id,
          user_id: staffUser.id,
          type: MovementType.IN,
          quantity: 200,
          reference_no: 'PO-2026-MED-001',
          notes: 'Penerimaan stok awal dari pabrik farmasi',
          created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          batch_id: savedBatches[0].id,
          user_id: staffUser.id,
          type: MovementType.OUT,
          quantity: 50,
          reference_no: 'DO-2026-RS-001',
          notes: 'Distribusi ke RSUP Fatmawati',
          created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          batch_id: savedBatches[1].id,
          user_id: staffUser.id,
          type: MovementType.IN,
          quantity: 35,
          reference_no: 'PO-2025-RET-09',
          notes: 'Batch sisa buffer penerimaan akhir tahun lalu',
          created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          batch_id: savedBatches[2].id,
          user_id: staffUser.id,
          type: MovementType.IN,
          quantity: 500,
          reference_no: 'PO-2026-MED-002',
          notes: 'Penerimaan batch reguler Paracetamol',
          created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          batch_id: savedBatches[2].id,
          user_id: staffUser.id,
          type: MovementType.OUT,
          quantity: 50,
          reference_no: 'DO-2026-APOTEK-01',
          notes: 'Pengiriman ke Kimia Farma Premier',
          created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          batch_id: savedBatches[3].id,
          user_id: staffUser.id,
          type: MovementType.IN,
          quantity: 30,
          reference_no: 'PO-2026-MED-003',
          notes: 'Penerimaan awal Candesartan',
          created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          batch_id: savedBatches[4].id,
          user_id: staffUser.id,
          type: MovementType.IN,
          quantity: 220,
          reference_no: 'PO-2026-SUPP-04',
          notes: 'Restock Vitamin C',
          created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        },
        {
          batch_id: savedBatches[5].id,
          user_id: staffUser.id,
          type: MovementType.IN,
          quantity: 95,
          reference_no: 'PO-2026-MED-005',
          notes: 'Penerimaan Cetirizine antihistamin',
          created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
      ];

      for (const mov of movementsData) {
        const m = queryRunner.manager.create(StockMovement, mov);
        await queryRunner.manager.save(StockMovement, m);
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Database demo berhasil di-reset ke kondisi awal pabrik.',
        stats: {
          categories: categoriesData.length,
          products: productsData.length,
          batches: batchesData.length,
          movements: movementsData.length,
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
