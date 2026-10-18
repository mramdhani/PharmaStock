import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import helmet from 'helmet';
import { SecuritySanitizerPipe } from './common/pipes/security-sanitizer.pipe';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Semua endpoint diawali /api/v1, contoh: /api/v1/health
  app.setGlobalPrefix('api/v1');

  // Keamanan 1: HTTP Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Diperlukan agar Swagger UI dapat memuat stylesheet & script interaktifnya
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Keamanan 2: Batasi ukuran body request (cegah payload raksasa / DoS)
  app.use(json({ limit: '100kb' }));

  // Keamanan 3: CORS terproteksi
  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_URL'),
    credentials: true,
    exposedHeaders: [
      'Retry-After',
      'retry-after',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  });

  // Keamanan 4: Sanitasi XSS, Filter Kata Kasar, dan Validasi DTO Ketat
  app.useGlobalPipes(
    new SecuritySanitizerPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger: dokumentasi API interaktif di /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PharmaStock API — Enterprise Pharmaceutical Inventory')
    .setDescription(
      `Sistem Manajemen Inventaris Farmasi Berbasis Batch & Expiry (NestJS + PostgreSQL).\n\n` +
        `### 🔑 Demo Credentials (Untuk Mencoba API):\n` +
        `- **Administrator**: \`admin@pharmastock.com\` | \`PharmaStock123!\` (Akses Penuh)\n` +
        `- **Staff Gudang**: \`staff@pharmastock.com\` | \`PharmaStock123!\` (Kelola Batch & Stock In/Out)\n` +
        `- **Public Viewer**: \`viewer@pharmastock.com\` | \`PharmaStock123!\` (Read-only, uji proteksi 403 Forbidden)\n\n` +
        `*Cara Menguji:* Login di endpoint \`POST /api/v1/auth/login\`, salin \`access_token\`, lalu klik tombol **Authorize** (gembok) di kanan atas.`,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Tutup koneksi DB dengan rapi saat aplikasi dimatikan (penting di Docker).
  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
  console.log(`🚀 API:     http://localhost:${port}/api/v1`);
  console.log(`📘 Swagger: http://localhost:${port}/api/docs`);
}
void bootstrap();
