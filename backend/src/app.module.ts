import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { BatchesModule } from './batches/batches.module';
import { CategoriesModule } from './categories/categories.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { envValidationSchema } from './config/env.validation';
import { typeOrmConfigFactory } from './config/typeorm.config';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { UsersModule } from './users/users.module';

/**
 * Root Module: "Akar" dari seluruh aplikasi PharmaStock.
 * Mengintegrasikan Database, Konfigurasi, Keamanan Global, dan Modul Fitur.
 */
@Module({
  imports: [
    // 1. Baca `.env` + validasi fail-fast
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // 2. Rate Limiting: 300 request per menit per alamat IP (aman dan leluasa untuk eksplorasi demo)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 300,
      },
    ]),

    // 3. Koneksi PostgreSQL via TypeORM (Dependency Injection ConfigService)
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory,
    }),

    // 4. Modul Autentikasi & Pengguna
    AuthModule,
    UsersModule,

    // 5. Modul Bisnis Farmasi
    CategoriesModule,
    ProductsModule,
    BatchesModule,
    StockModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    // Standarisasi Response Sukses: { success: true, statusCode, message, data }
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Standarisasi Response Error: { success: false, statusCode, message, errors }
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Keamanan 1: Rate Limiter Guard (Cegah Spam & Brute-force)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Keamanan 2: Global JWT Authentication Guard (Kecuali route @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Keamanan 3: Role-Based Access Control Guard (@Roles(UserRole.ADMIN, ...))
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
