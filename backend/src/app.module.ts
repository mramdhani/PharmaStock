import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { CategoriesModule } from './categories/categories.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { envValidationSchema } from './config/env.validation';
import { typeOrmConfigFactory } from './config/typeorm.config';
import { ProductsModule } from './products/products.module';

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

    // 3. Modul Fitur
    CategoriesModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [
    // Standarisasi response sukses: { success: true, statusCode, message, data }
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Standarisasi response error: { success: false, statusCode, message, errors }
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}

