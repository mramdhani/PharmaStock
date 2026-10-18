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

### Step 2.5 — Standarisasi Response & Error Handling ✅
- **Kebutuhan**: Format respon API seragam di seluruh aplikasi, controller tidak perlu menulis wrapper JSON berulang-ulang.
- **Success Interceptor** (`src/common/interceptors/response.interceptor.ts`):
  - Membungkus semua return controller ke struktur:
    ```json
    { "success": true, "statusCode": 200, "message": "...", "data": ... }
    ```
  - Mendukung decorator kustom `@ResponseMessage('Pesan Anda')` (`src/common/decorators/response-message.decorator.ts`).
- **Global Exception Filter** (`src/common/filters/http-exception.filter.ts`):
  - Menangkap semua error (400 DTO validation, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, hingga 500 runtime error).
  - Mengubahnya otomatis menjadi struktur:
    ```json
    { "success": false, "statusCode": 400, "message": "Validation failed", "errors": [ ... ] }
    ```
  - Di environment production, rincian error internal (stack trace) disembunyikan demi keamanan.
- **Pagination DTO Reusable** (`src/common/dto/pagination.dto.ts`): DTO standar untuk `page`, `limit`, dan `search`.

### Step 3 — Entity & Migration (5 Tabel ERD) ✅
- Membuat 5 Entity TypeORM:
  1. `User` (`src/users/entities/user.entity.ts`)
  2. `Category` (`src/categories/entities/category.entity.ts`)
  3. `Product` (`src/products/entities/product.entity.ts`)
  4. `Batch` (`src/batches/entities/batch.entity.ts`)
  5. `StockMovement` (`src/stock/entities/stock-movement.entity.ts`)
- Menerapkan relasi foreign key, indeks unik (`sku`, `email`, `category.name`), indeks gabungan unik `UNIQUE(product_id, batch_number)`, dan check constraint PostgreSQL (`minimum_stock >= 0`, `current_stock >= 0`, `quantity > 0`).
- Menyiapkan TypeORM CLI `src/database/data-source.ts` dengan script:
  - `npm run migration:generate`
  - `npm run migration:run`
- Menjalankan migrasi pertama `InitialSchema` dan berhasil membuat 6 tabel (5 tabel bisnis + tabel pelacak `migrations`).
- Bisa langsung dilihat dan di-*refresh* di DBeaver!

### Step 4 — Modul Pertama: Categories (Master Category CRUD) ⏳



