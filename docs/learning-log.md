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

### Step 2 — Inisialisasi Backend NestJS ⏳

