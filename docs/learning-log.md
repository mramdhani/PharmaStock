# Catatan Belajar PharmaStock

Setiap langkah dicatat di sini: apa yang dikerjakan, kenapa, dan konsep yang dipelajari.

## Fase 1 — Foundation

### Step 0 — Fondasi repo ✅
- Membuat root monorepo sederhana: `backend/`, `frontend/`, `deploy/`, `docs/`.
- `.gitignore` di root memastikan `.env` (password DB, JWT secret) **tidak pernah** masuk GitHub.
- Konsep: **monorepo sederhana** = satu repo Git, tapi `frontend` dan `backend` punya `package.json` masing-masing, jadi bisa dijalankan sendiri-sendiri.
- Konsep: **DBeaver vs PostgreSQL**. DBeaver hanya *client* (alat melihat data), sedangkan PostgreSQL adalah *server* yang menyimpan data.

### Step 1 — Install & siapkan PostgreSQL 17 ✅
- Menginstal PostgreSQL 17 via Homebrew (`brew install postgresql@17`).
- Menjalankan PostgreSQL service via `brew services start postgresql@17`.
- Membuat user aplikasi terbatas: `pharmastock_app` (bukan superuser).
- Membuat database: `pharmastock` dengan owner `pharmastock_app`.
- **Kredensial Lokal untuk DBeaver / NestJS:**
  - **Host**: `localhost`
  - **Port**: `5432`
  - **Database**: `pharmastock`
  - **Username**: `pharmastock_app`
  - **Password**: `pharmastock_dev_password_2026`
- **Konsep Keamanan**: Prinsip *Least Privilege* — aplikasi backend dan client development tidak boleh menggunakan superuser `postgres` untuk operasional sehari-hari.

### Step 2 — Inisialisasi Backend NestJS ✅
- NestJS 12, **CommonJS + Jest** (sesuai blueprint; TypeORM CLI paling stabil di CJS).
- Dependensi: `@nestjs/config`, `joi`, `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/swagger`, `class-validator`, `class-transformer`.
- File penting:
  - `src/config/env.validation.ts`: validasi `.env` dengan Joi saat startup (**fail fast**).
  - `src/config/typeorm.config.ts`: koneksi DB dari env, `synchronize: false`.
  - `src/app.module.ts`: `ConfigModule.forRoot` + `TypeOrmModule.forRootAsync`.
  - `src/main.ts`: prefix `/api/v1`, body limit 100kb, CORS, global `ValidationPipe`, Swagger.
  - `src/app.controller.ts`: `GET /api/v1/health` (cek API + DB).
- Konsep: **Module** = wadah yang mengelompokkan controller & provider. **Dependency Injection** = NestJS yang membuat & memberikan objek (misal `DataSource`, `ConfigService`) ke constructor, kita tidak `new` sendiri.
- Konsep: **forRoot vs forRootAsync**. `forRootAsync` dipakai saat konfigurasi butuh provider lain (di sini `ConfigService`).
- Konsep: **Unit test dengan mock**. `DataSource` diganti objek palsu, jadi test tidak butuh database.
- Catatan: role `pharmastock` (untuk DBeaver) sudah bukan superuser. Untuk melihat tabel buatan aplikasi, DBeaver sebaiknya login sebagai `pharmastock_app`.
- Cek: `npm run start:dev` lalu buka http://localhost:3001/api/docs

### Step 3 — Entity & Migration (5 tabel ERD) ⏳


