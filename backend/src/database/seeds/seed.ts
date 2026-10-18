import * as bcrypt from 'bcryptjs';
import AppDataSource from '../data-source';
import { User, UserRole } from '../../users/entities/user.entity';

/**
 * Script Seeder Database
 * Membuat akun awal: Admin, Staff, dan Viewer dengan password ter-hash bcrypt.
 * Jalankan dengan: npm run seed
 */
export async function seed() {
  console.log('🌱 Menjalankan Seeder Database...');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  const defaultPassword = await bcrypt.hash('PharmaStock123!', 10);

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

  for (const userData of defaultUsers) {
    const existing = await userRepo.findOne({
      where: { email: userData.email },
    });

    if (!existing) {
      const user = userRepo.create(userData);
      await userRepo.save(user);
      console.log(`✅ User dibuat: ${userData.email} (${userData.role})`);
    } else {
      console.log(`ℹ️  User sudah ada: ${userData.email}`);
    }
  }

  await AppDataSource.destroy();
  console.log('✨ Seeder Selesai!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Gagal menjalankan seeder:', err);
      process.exit(1);
    });
}
