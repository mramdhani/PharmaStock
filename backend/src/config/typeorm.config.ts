import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Konfigurasi koneksi TypeORM ke PostgreSQL.
 *
 * Nilainya diambil dari ConfigService (yang membaca `.env`),
 * jadi tidak ada password yang ditulis langsung di kode.
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

  // Daftarkan entity otomatis dari setiap module lewat TypeOrmModule.forFeature().
  autoLoadEntities: true,

  // WAJIB false: perubahan struktur tabel hanya lewat migration,
  // supaya database (terutama di VPS) tidak berubah diam-diam.
  synchronize: false,

  // Tampilkan query SQL di terminal saat development untuk belajar.
  logging: config.get<string>('NODE_ENV') === 'development',
});
