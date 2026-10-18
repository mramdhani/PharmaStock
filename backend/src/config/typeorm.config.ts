import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Batch } from '../batches/entities/batch.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { User } from '../users/entities/user.entity';

/**
 * Konfigurasi koneksi TypeORM ke PostgreSQL.
 *
 * Mendaftarkan seluruh 5 Entity agar TypeORM memahami relasi
 * bidirectional (OneToMany, ManyToOne) di seluruh modul.
 */
export const typeOrmConfigFactory = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.getOrThrow<string>('DB_HOST'),
  port: config.getOrThrow<number>('DB_PORT'),
  database: config.getOrThrow<string>('DB_NAME'),
  username: config.getOrThrow<string>('DB_USER'),
  password: config.getOrThrow<string>('DB_PASSWORD'),

  // Daftarkan seluruh 5 Entity sesuai ERD
  entities: [User, Category, Product, Batch, StockMovement],

  // WAJIB false: perubahan skema hanya lewat migration
  synchronize: false,

  // Tampilkan query SQL di terminal saat development untuk belajar
  logging: config.get<string>('NODE_ENV') === 'development',
});
