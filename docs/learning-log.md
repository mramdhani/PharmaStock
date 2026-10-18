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

### Step 4 — Modul Pertama: Categories (Master Category CRUD) ✅
- **Arsitektur Modul Standar & Bersih**:
  ```
  src/categories/
  ├── dto/
  │   ├── create-category.dto.ts  <-- Validasi teks, min 2, max 100, trim spasi, Swagger @ApiProperty
  │   └── update-category.dto.ts  <-- PartialType(CreateCategoryDto)
  ├── entities/
  │   └── category.entity.ts      <-- UUID PK, unique name, OneToMany Product
  ├── categories.service.ts       <-- Cek duplikat (409 Conflict), pagination, ILike search, proteksi relasi
  ├── categories.controller.ts    <-- ParseUUIDPipe(id), @ResponseMessage, status code
  ├── categories.service.spec.ts  <-- Unit test (create, conflict, findOne) dengan mock repository
  └── categories.module.ts        <-- TypeOrmModule.forFeature([Category])
  ```
- **Poin Keamanan & Best Practice**:
  1. `ParseUUIDPipe`: parameter `:id` di-validate langsung di layer routing; jika bukan format UUID langsung ditolak `400 Bad Request` tanpa menyentuh database.
  2. `Transform`: input string otomatis di-`trim()` agar tidak ada kategori berisi spasi kosong semata.
  3. `ConflictException`: jika membuat/mengubah nama kategori yang sudah ada, ditolak dengan pesan jelas (`409 Conflict`).
  4. Proteksi Relasi: kategori yang sudah dipakai oleh produk tidak bisa dihapus sembarangan.
  5. Seluruh 5 Entity didaftarkan di `typeOrmConfigFactory` untuk memastikan relasi antar-tabel dikenali oleh TypeORM.
- **Pengujian**:
  - 7 unit test lulus (`npm test`).
  - Pengujian live: `POST`, duplicate check, validasi gagal, `GET` pagination & search, `PATCH`, dan `DELETE`.
  - Terdokumentasi otomatis di Swagger http://localhost:3001/api/docs.

### Step 5 — Modul Products (Master Data Produk & Relasi Category) ✅
- **Arsitektur Modul**:
  ```
  src/products/
  ├── dto/
  │   ├── create-product.dto.ts  <-- category_id (UUID), sku (Uppercase, regex [A-Z0-9_-]+), unit, minimum_stock (>= 0)
  │   ├── update-product.dto.ts  <-- PartialType + is_active boolean
  │   └── product-query.dto.ts   <-- extends PaginationQueryDto, filter category_id, is_active, low_stock
  ├── entities/
  │   └── product.entity.ts      <-- Check("minimum_stock" >= 0), relasi Category & Batches
  ├── products.service.ts        <-- Validasi FK category, cek SKU duplikat, hitung total_stock, smart deactivation
  ├── products.controller.ts     <-- ParseUUIDPipe, Swagger, @ResponseMessage
  ├── products.service.spec.ts   <-- Unit tests (NotFound category, Conflict SKU)
  └── products.module.ts         <-- TypeOrmModule.forFeature([Product, Category, Batch])
  ```
- **Poin Keamanan & Best Practice**:
  1. `Transform UpperCase & Regex`: SKU otomatis diubah menjadi huruf kapital dan difilter agar hanya karakter aman (`[A-Z0-9_-]+`) yang lolos.
  2. `Foreign Key Validation`: Memastikan kategori yang dituju benar-benar ada di database sebelum menyimpan produk, mencegah *orphan foreign key*.
  3. `Kalkulasi Dinamis (FEFO)`: Menghitung saldo `total_stock` dari seluruh batch produk dan mendeteksi secara *real-time* status `is_low_stock` (stok menipis).
  4. `Smart Deactivation (Prinsip Audit Perusahaan)`: Jika produk sudah memiliki riwayat batch, sistem melindunginya dari penghapusan permanen dan mengubah statusnya menjadi `is_active: false`.
- **Pengujian**:
  - 10 unit test lulus (`npm test`).
  - Pengujian live: `POST`, verifikasi category UUID, penolakan SKU duplikat, kalkulasi `total_stock`, `PATCH`, dan `DELETE`.
  - Terdokumentasi otomatis di Swagger http://localhost:3001/api/docs.

### Step 6 — Modul Batches (Manajemen Batch & Expiry Tracking) ✅
- **Arsitektur Modul**:
  ```
  src/batches/
  ├── dto/
  │   ├── create-batch.dto.ts   <-- product_id (UUID), batch_number (Uppercase), expiry_date (YYYY-MM-DD)
  │   ├── update-batch.dto.ts   <-- PartialType(CreateBatchDto)
  │   └── batch-query.dto.ts    <-- product_id, has_stock, days, search, pagination
  ├── entities/
  │   └── batch.entity.ts       <-- UNIQUE(product_id, batch_number), CHECK(current_stock >= 0)
  ├── batches.service.ts        <-- Validasi tanggal expired masa depan, saldo awal 0, FEFO query, hitung sisa hari
  ├── batches.controller.ts     <-- Route /expiring (alert dashboard), ParseUUIDPipe, ParseIntPipe
  ├── batches.service.spec.ts   <-- Unit tests (NotFound product, Past expiry check, Conflict duplicate, Initial stock 0)
  └── batches.module.ts         <-- TypeOrmModule.forFeature([Batch, Product, StockMovement])
  ```
- **Poin Keamanan & Best Practice Industri Farmasi**:
  1. `Kebijakan Saldo Awal 0`: Pembuatan batch baru **selalu** memiliki saldo `current_stock = 0`. Stok hanya bisa bertambah melalui transaksi resmi `Stock In` demi akuntabilitas audit.
  2. `Composite Uniqueness`: Satu produk tidak boleh memiliki nomor batch yang sama (`UNIQUE(product_id, batch_number)`).
  3. `Validasi Expiry Date Masa Depan`: Mencegah human error memasukkan obat yang sudah kedaluwarsa saat pencatatan batch baru.
  4. `FEFO (First Expired, First Out)`: Query batch otomatis diurutkan berdasarkan tanggal kedaluwarsa paling dekat (`expiry_date ASC`), sehingga staf gudang selalu memprioritaskan batch yang harus dikeluarkan lebih dulu.
  5. `Endpoint Peringatan Dini (/batches/expiring)`: Menampilkan batch yang bersaldo dan akan kedaluwarsa dalam 30/60/90 hari untuk widget alert di dashboard.
- **Pengujian**:
  - 15 unit test lulus (`npm test`).
  - Pengujian live: penolakan expired masa lalu, pembuatan batch, penolakan nomor batch duplikat, verifikasi urutan FEFO, dan filter dashboard.
  - Terdokumentasi otomatis di Swagger http://localhost:3001/api/docs.

### Step 7 — Modul Stock Movements & Transaksi Database (Stock In / Out) ✅
- **Arsitektur Modul**:
  ```
  src/stock/
  ├── dto/
  │   ├── stock-in.dto.ts    <-- batch_id, quantity (> 0), reference_no (PO), notes
  │   ├── stock-out.dto.ts   <-- batch_id, quantity (> 0), reference_no (DO), notes
  │   └── stock-query.dto.ts <-- filter type (IN/OUT), batch_id, product_id, pagination
  ├── entities/
  │   └── stock-movement.entity.ts <-- Immutable Ledger, Check(quantity > 0), relasi Batch & User
  ├── stock.service.ts       <-- ACID Transaction (QueryRunner), Pessimistic Lock, Anti-Race Condition
  ├── stock.controller.ts    <-- /stock/in, /stock/out, /stock/movements
  ├── stock.service.spec.ts  <-- 21 passing unit tests
  └── stock.module.ts        <-- TypeOrmModule.forFeature([StockMovement, Batch, User, Product])
  ```
- **Poin Keamanan & Best Practice Enterprise (Wajib untuk Interview)**:
  1. `Database Transaction (ACID)`: Menggunakan `QueryRunner` dari TypeORM. Perubahan saldo `current_stock` pada tabel `batches` dan pencatatan riwayat ke `stock_movements` dibungkus dalam satu transaksi. Jika salah satu gagal, seluruh operasi di-*rollback* otomatis sehingga tidak ada data yang pincang.
  2. `Pessimistic Row-Level Locking (SELECT ... FOR UPDATE)`:
     - Mencegah *Race Condition* (misal dua staf mengeluarkan stok yang sama secara bersamaan).
     - *Pelajaran Penting PostgreSQL*: `FOR UPDATE` hanya dikunci pada tabel tunggal `batches` tanpa `LEFT JOIN` relasi luar (`nullable side of outer join`), sehingga query locking berjalan sangat cepat dan sesuai standar ANSI SQL.
  3. `Proteksi Obat Expired`: Sistem menolak transaksi `Stock Out` pada batch yang sudah melewati tanggal kedaluwarsa (`409 Conflict`), mematuhi regulasi farmasi.
  4. `Pemeriksaan Saldo Real-Time`: Jika diminta 80 unit sedangkan saldo tersisa 70 unit, sistem langsung menolak dengan `409 Conflict (Stok tidak mencukupi)`.
  5. `Buku Besar Abadi (Immutable Ledger)`: Riwayat pergerakan stok tidak menyediakan endpoint `PATCH` atau `DELETE`. Setiap gram/unit obat yang keluar-masuk selalu terlacak lengkap dengan `user_id`, nomor PO/DO, dan waktu transaksi.
- **Pengujian**:
  - 21 unit test lulus (`npm test`).
  - Pengujian live: penolakan stok 0 (409), penolakan quantity negatif (400), sukses Stock In 100 unit (saldo 100), sukses Stock Out 30 unit (saldo 70), penolakan permintaan melebihi saldo (409), verifikasi buku besar, dan update otomatis total stok produk menjadi 70.
  - Terdokumentasi otomatis di Swagger http://localhost:3001/api/docs.

### Step 8 — Authentication & Authorization (JWT, Bcrypt, & RolesGuard) ⏳







