import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { envValidationSchema } from './config/env.validation';
import { typeOrmConfigFactory } from './config/typeorm.config';

/**
 * Root module: "akar" dari seluruh aplikasi.
 * Semua module fitur (Auth, Products, Stock, dll) nanti di-import di sini.
 */
@Module({
  imports: [
    // 1. Baca `.env` + validasi. isGlobal = bisa dipakai di module mana pun.
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // 2. Koneksi database. forRootAsync dipakai karena butuh ConfigService
    //    (yang baru tersedia setelah ConfigModule siap) -> Dependency Injection.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory,
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
