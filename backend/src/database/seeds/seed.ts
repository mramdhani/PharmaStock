import * as bcrypt from 'bcryptjs';
import AppDataSource from '../data-source';
import { Batch } from '../../batches/entities/batch.entity';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';
import { MovementType, StockMovement } from '../../stock/entities/stock-movement.entity';
import { User, UserRole } from '../../users/entities/user.entity';

/**
 * Script Seeder Database
 * Membuat akun awal (Admin, Staff, Viewer), Kategori, Produk, Batch, dan Riwayat Stok.
 * Jalankan dengan: npm run seed
 */
export async function seed() {
  console.log('🌱 Menjalankan Seeder Database PharmaStock...');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const batchRepo = AppDataSource.getRepository(Batch);
  const movementRepo = AppDataSource.getRepository(StockMovement);

  const defaultPassword = await bcrypt.hash('PharmaStock123!', 10);

  // 1. Akun Pengguna
  const defaultUsers = [
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
  for (const userData of defaultUsers) {
    let existing = await userRepo.findOne({
      where: { email: userData.email },
    });

    if (!existing) {
      const user = userRepo.create(userData);
      existing = await userRepo.save(user);
      console.log(`✅ User dibuat: ${userData.email} (${userData.role})`);
    } else {
      console.log(`ℹ️  User sudah ada: ${userData.email}`);
    }
    userMap.set(userData.email, existing);
  }

  // 2. Kategori Farmasi
  const categoryNames = [
    'Antibiotik',
    'Analgesik & Antipiretik',
    'Kardiovaskular',
    'Suplemen & Vitamin',
    'Antihistamin',
  ];

  const categoryMap = new Map<string, Category>();
  for (const name of categoryNames) {
    let cat = await categoryRepo.findOne({ where: { name } });
    if (!cat) {
      cat = await categoryRepo.save(categoryRepo.create({ name }));
      console.log(`✅ Kategori dibuat: ${name}`);
    }
    categoryMap.set(name, cat);
  }

  // 3. Produk Master
  const products = [
    {
      category_id: categoryMap.get('Antibiotik')!.id,
      sku: 'MED-AMX-500',
      name: 'Amoxicillin Trihydrate 500mg',
      unit: 'Kapsul',
      minimum_stock: 100,
    },
    {
      category_id: categoryMap.get('Analgesik & Antipiretik')!.id,
      sku: 'MED-PCT-500',
      name: 'Paracetamol 500mg Dexa',
      unit: 'Tablet',
      minimum_stock: 200,
    },
    {
      category_id: categoryMap.get('Kardiovaskular')!.id,
      sku: 'MED-CND-008',
      name: 'Candesartan Cilexetil 8mg',
      unit: 'Tablet',
      minimum_stock: 50,
    },
    {
      category_id: categoryMap.get('Suplemen & Vitamin')!.id,
      sku: 'VIT-VTC-500',
      name: 'Vitamin C 500mg Buffered Non-Acidic',
      unit: 'Kaplet',
      minimum_stock: 150,
    },
    {
      category_id: categoryMap.get('Antihistamin')!.id,
      sku: 'MED-CTZ-010',
      name: 'Cetirizine HCl 10mg',
      unit: 'Tablet',
      minimum_stock: 80,
    },
  ];

  const productMap = new Map<string, Product>();
  for (const pData of products) {
    let prod = await productRepo.findOne({ where: { sku: pData.sku } });
    if (!prod) {
      prod = await productRepo.save(productRepo.create(pData));
      console.log(`✅ Produk dibuat: ${pData.name} (${pData.sku})`);
    }
    productMap.set(pData.sku, prod);
  }

  // 4. Batch & Tanggal Kedaluwarsa
  const now = new Date();
  const nearExpiryDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const futureDate1 = new Date(now.getTime() + 500 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const futureDate2 = new Date(now.getTime() + 720 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const batches = [
    {
      product_id: productMap.get('MED-AMX-500')!.id,
      batch_number: 'BAT-AMX-2026A',
      expiry_date: futureDate1,
      current_stock: 150,
    },
    {
      product_id: productMap.get('MED-AMX-500')!.id,
      batch_number: 'BAT-AMX-2025EXP',
      expiry_date: nearExpiryDate,
      current_stock: 35,
    },
    {
      product_id: productMap.get('MED-PCT-500')!.id,
      batch_number: 'BAT-PCT-202601',
      expiry_date: futureDate2,
      current_stock: 450,
    },
    {
      product_id: productMap.get('MED-CND-008')!.id,
      batch_number: 'BAT-CND-2026X',
      expiry_date: futureDate1,
      current_stock: 30, // Low stock alert
    },
    {
      product_id: productMap.get('VIT-VTC-500')!.id,
      batch_number: 'BAT-VTC-20261',
      expiry_date: futureDate2,
      current_stock: 220,
    },
    {
      product_id: productMap.get('MED-CTZ-010')!.id,
      batch_number: 'BAT-CTZ-20269',
      expiry_date: futureDate1,
      current_stock: 95,
    },
  ];

  const savedBatches: Batch[] = [];
  for (const bData of batches) {
    let batch = await batchRepo.findOne({
      where: {
        product_id: bData.product_id,
        batch_number: bData.batch_number,
      },
    });
    if (!batch) {
      batch = await batchRepo.save(batchRepo.create(bData));
      console.log(`✅ Batch dibuat: ${bData.batch_number} (Stok: ${bData.current_stock})`);
    }
    savedBatches.push(batch);
  }

  // 5. Riwayat Stok Masuk / Keluar
  const staff = userMap.get('staff@pharmastock.com')!;
  const existingMovements = await movementRepo.count();
  if (existingMovements === 0) {
    const movements = [
      {
        batch_id: savedBatches[0].id,
        user_id: staff.id,
        type: MovementType.IN,
        quantity: 200,
        reference_no: 'PO-2026-DEXA-001',
        notes: 'Penerimaan stok awal dari pabrik Cikarang',
        created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        batch_id: savedBatches[0].id,
        user_id: staff.id,
        type: MovementType.OUT,
        quantity: 50,
        reference_no: 'DO-2026-RS-001',
        notes: 'Distribusi ke RSUP Fatmawati',
        created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        batch_id: savedBatches[1].id,
        user_id: staff.id,
        type: MovementType.IN,
        quantity: 35,
        reference_no: 'PO-2025-RET-09',
        notes: 'Batch sisa buffer penerimaan akhir tahun lalu',
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        batch_id: savedBatches[2].id,
        user_id: staff.id,
        type: MovementType.IN,
        quantity: 500,
        reference_no: 'PO-2026-DEXA-002',
        notes: 'Penerimaan batch reguler Paracetamol',
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        batch_id: savedBatches[2].id,
        user_id: staff.id,
        type: MovementType.OUT,
        quantity: 50,
        reference_no: 'DO-2026-APOTEK-01',
        notes: 'Pengiriman ke Kimia Farma Premier',
        created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        batch_id: savedBatches[3].id,
        user_id: staff.id,
        type: MovementType.IN,
        quantity: 30,
        reference_no: 'PO-2026-DEXA-003',
        notes: 'Penerimaan awal Candesartan',
        created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        batch_id: savedBatches[4].id,
        user_id: staff.id,
        type: MovementType.IN,
        quantity: 220,
        reference_no: 'PO-2026-SUPP-04',
        notes: 'Restock Vitamin C',
        created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
      {
        batch_id: savedBatches[5].id,
        user_id: staff.id,
        type: MovementType.IN,
        quantity: 95,
        reference_no: 'PO-2026-DEXA-005',
        notes: 'Penerimaan Cetirizine antihistamin',
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ];

    for (const mov of movements) {
      await movementRepo.save(movementRepo.create(mov));
    }
    console.log(`✅ ${movements.length} Stock movements berhasil di-seed`);
  }

  await AppDataSource.destroy();
  console.log('✨ Seeder Selesai dengan Sukses!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Gagal menjalankan seeder:', err);
      process.exit(1);
    });
}
