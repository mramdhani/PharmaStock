# PharmaStock — Blueprint v1.0

> Dokumen ini dikunci sebagai v1.0. Fitur baru (supplier, PO, multi-warehouse) **tidak** ditambahkan sebelum MVP selesai & online.

## 1. Definisi

Aplikasi web untuk mengelola stok produk farmasi berdasarkan nomor batch, tanggal kedaluwarsa, dan riwayat pergerakan stok.

| Role   | Kewenangan                                         |
| ------ | -------------------------------------------------- |
| ADMIN  | Kelola produk, batch, stok, pengguna               |
| STAFF  | Lihat data, buat batch, catat stok masuk/keluar    |
| VIEWER | Hanya melihat (dipakai untuk akun demo publik)     |

## 2. Arsitektur

Modular monolith (1 aplikasi NestJS).

```mermaid
flowchart LR
  B[Browser] -->|HTTPS| C[Caddy]
  C --> F[Next.js :3000]
  C -->|/api| N[NestJS :3001]
  N --> P[(PostgreSQL :5432 - private)]
```

## 3. ERD

```mermaid
erDiagram
  USERS ||--o{ STOCK_MOVEMENTS : records
  CATEGORIES ||--o{ PRODUCTS : contains
  PRODUCTS ||--o{ BATCHES : has
  BATCHES ||--o{ STOCK_MOVEMENTS : tracks

  USERS {
    uuid id PK
    varchar name
    varchar email UK
    varchar password_hash
    varchar role "ADMIN|STAFF|VIEWER"
    boolean is_active
    timestamptz created_at
    timestamptz updated_at
  }
  CATEGORIES {
    uuid id PK
    varchar name UK
    timestamptz created_at
  }
  PRODUCTS {
    uuid id PK
    uuid category_id FK
    varchar sku UK
    varchar name
    varchar unit
    int minimum_stock "CHECK >= 0"
    boolean is_active
    timestamptz created_at
    timestamptz updated_at
  }
  BATCHES {
    uuid id PK
    uuid product_id FK
    varchar batch_number "UNIQUE(product_id, batch_number)"
    date expiry_date
    int current_stock "CHECK >= 0"
    timestamptz created_at
    timestamptz updated_at
  }
  STOCK_MOVEMENTS {
    uuid id PK
    uuid batch_id FK
    uuid user_id FK
    varchar type "IN|OUT"
    int quantity "CHECK > 0"
    varchar reference_no
    text notes
    timestamptz created_at
  }
```

Aturan penting:
- `current_stock` (saldo) dan `stock_movements` (riwayat) **selalu** diubah dalam satu database transaction dengan row lock (`SELECT ... FOR UPDATE`).
- Riwayat stok tidak bisa diubah/dihapus via API.
- Produk dinonaktifkan (`is_active=false`), bukan dihapus.
- FEFO: sistem merekomendasikan batch yang paling cepat expired (belum expired).

## 4. REST API (`/api/v1`)

| Method | Endpoint             | Role         |
| ------ | -------------------- | ------------ |
| POST   | /auth/login          | Public       |
| GET    | /auth/me             | Login        |
| GET    | /users               | Admin        |
| POST   | /users               | Admin        |
| PATCH  | /users/:id           | Admin        |
| GET    | /categories          | Login        |
| POST   | /categories          | Admin        |
| GET    | /products            | Login        |
| GET    | /products/:id        | Login        |
| POST   | /products            | Admin        |
| PATCH  | /products/:id        | Admin        |
| GET    | /batches             | Login        |
| POST   | /batches             | Admin/Staff  |
| GET    | /batches/expiring    | Login        |
| POST   | /stock/in            | Admin/Staff  |
| POST   | /stock/out           | Admin/Staff  |
| GET    | /stock/movements     | Login        |
| GET    | /dashboard/summary   | Login        |
| GET    | /health              | Public       |

Format response seragam lewat Global Response Interceptor & Global Exception Filter:

```json
{ "success": true, "statusCode": 201, "message": "...", "data": {} }
{ "success": false, "statusCode": 409, "message": "Insufficient stock", "errors": null }
```

## 5. Keamanan (wajib sejak awal)

| Komponen        | Implementasi                                                  |
| --------------- | ------------------------------------------------------------- |
| Authentication  | JWT, bcrypt                                                   |
| Authorization   | JwtAuthGuard + RolesGuard                                     |
| Validation      | DTO + global ValidationPipe (`whitelist`, `forbidNonWhitelisted`), body size limit |
| Rate limiting   | @nestjs/throttler, lebih ketat di /auth/login                 |
| Database        | Postgres tidak diekspos ke internet, user DB terbatas         |
| HTTPS           | Caddy (TLS otomatis)                                          |
| Secrets         | `.env` tidak di-commit, divalidasi saat startup               |
| Swagger         | Publik dibaca, operasi tulis butuh token                      |
| Demo mode       | Data fiktif, akun Viewer read-only, tidak ada Admin publik    |
| Token di browser| Cookie HttpOnly + Secure + SameSite, bukan localStorage       |
| TypeORM         | `synchronize: false`, pakai migrations                        |
| Monitoring      | Health check, Docker logs, CPU/RAM                            |
| Backup          | pg_dump terjadwal + uji restore                               |
| Audit           | Setiap stock movement mencatat user & waktu                   |

## 6. Testing Wajib

| Kasus                                   | Hasil                 |
| --------------------------------------- | --------------------- |
| Password salah                          | 401                   |
| Tanpa token                             | 401                   |
| Viewer POST produk                      | 403                   |
| SKU duplikat                            | 409                   |
| Stock out > stok                        | 409                   |
| Stock out batch expired                 | Ditolak               |
| Quantity <= 0                           | 400                   |
| Field tidak dikenal                     | 400                   |
| Dua stock out bersamaan                 | Stok tidak negatif    |
| Transaksi gagal                         | Tidak ada perubahan parsial |

## 7. Roadmap

1. **Foundation** — monorepo, PostgreSQL, TypeORM, 5 entity + migration, Swagger
2. **Core Backend** — Categories, Products, Batches, DTO, pagination
3. **Business Logic** — Stock In/Out, transaction & locking, JWT & roles, testing
4. **Frontend** — Login, dashboard, products, batches, stock
5. **Security & Deployment** — rate limit, cookies, Docker Compose, VPS, HTTPS, backup
6. **Portfolio** — README, ERD, screenshot, live demo, review
