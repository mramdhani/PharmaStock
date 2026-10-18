# 🚀 Panduan Deployment VPS PharmaStock

Panduan ini berisi langkah-langkah praktis dan teruji untuk mendeploy sistem inventaris farmasi **PharmaStock** ke VPS (Virtual Private Server) berbasis Ubuntu/Debian.

---

## 📋 Persyaratan Sistem

- **OS**: Ubuntu 22.04 LTS / 24.04 LTS (disarankan)
- **RAM**: Minimal 2 GB (Rekomendasi 4 GB untuk build Next.js yang cepat)
- **Disk**: Minimal 20 GB SSD
- **Port Terbuka**: 80 (HTTP), 443 (HTTPS), 22 (SSH)

---

## 🛠️ Langkah 1: Persiapan VPS & Install Docker

Jalankan perintah berikut di terminal VPS:

```bash
# Update repository
sudo apt update && sudo apt upgrade -y

# Install dependensi dasar & Nginx
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx

# Install Docker Engine & Docker Compose Plugin
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Aktifkan Firewall UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

> **Catatan**: Logout dan login kembali ke SSH agar grup docker aktif.

---

## 📦 Langkah 2: Clone Repository & Konfigurasi Lingkungan

```bash
# Masuk ke direktori web/apps
cd /var/www  # atau di home folder Anda: cd ~
git clone <URL_REPO_PHARMASTOCK>.git pharmastock
cd pharmastock

# Salin file konfigurasi environment
cp .env.production.example .env
```

Edit file `.env` menggunakan `nano .env`:
- Ubah `DB_PASSWORD` dengan kata sandi acak yang kuat.
- Ubah `JWT_SECRET` dengan string acak (minimal 32 karakter).
- Sesuaikan `CORS_ORIGIN` dan `NEXT_PUBLIC_API_URL` dengan domain Anda (misal `https://pharmastock.domainanda.com`).

---

## 🚢 Langkah 3: Build & Jalankan Kontainer Docker

Jalankan perintah berikut di root folder `pharmastock`:

```bash
docker compose up -d --build
```

Docker Compose akan otomatis:
1. Menjalankan database **PostgreSQL 16** dan menunggu sampai siap (healthcheck).
2. Membuild image **NestJS Backend**, menjalankan migrasi database, dan mengeksekusi seeder akun demo serta katalog produk.
3. Membuild bundle **Next.js 16 Standalone** dan melayani frontend di port `3000`.

Periksa status kontainer:
```bash
docker compose ps
docker compose logs -f backend
```

---

## 🌐 Langkah 4: Konfigurasi Nginx & SSL HTTPS

1. Salin template konfigurasi Nginx:
```bash
sudo cp deploy/nginx/pharmastock.conf /etc/nginx/sites-available/pharmastock.conf
```

2. Buka dan ganti `your-domain.com` dengan domain Anda:
```bash
sudo nano /etc/nginx/sites-available/pharmastock.conf
```

3. Aktifkan konfigurasi dan test:
```bash
sudo ln -s /etc/nginx/sites-available/pharmastock.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Pasang Sertifikat SSL Gratis via Certbot (Let's Encrypt):
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🔒 Fitur Keamanan Terpasang

1. **Anti-XSS & HTML Sanitizer**: Menghapus tag script, iframe, dan karakter berbahaya pada seluruh input.
2. **Profanity Filter**: Menyensor kata-kata kasar/vulgar (Bahasa Indonesia & Inggris) menjadi tanda bintang (`***`).
3. **Throttler & Rate Limiting**: Proteksi login anti-brute force dengan hitung mundur waktu (countdown timer).
4. **Proteksi Akun Demo**: Akun default demo (`admin@pharmastock.com`, `staff@pharmastock.com`, `viewer@pharmastock.com`) terkunci dari penggantian email, password, maupun penonaktifan.
5. **Reset Database Demo Mandiri**: Tersedia tombol di halaman Pengguna (khusus Admin) atau endpoint `POST /api/v1/system/reset-demo` untuk merestore data jika diacak-acak oleh pengunjung demo.
6. **HTTP Security Headers**: Dilengkapi Helmet & header Nginx (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy).

---

## 🔑 Kredensial Akun Demo Publik

| Role | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@pharmastock.com` | `PharmaStock123!` | Full akses (Master data, user management, demo reset) |
| **Gudang (Staff)** | `staff@pharmastock.com` | `PharmaStock123!` | Kelola stok masuk, stok keluar, batch |
| **Viewer** | `viewer@pharmastock.com` | `PharmaStock123!` | Hanya melihat katalog & ringkasan dashboard |

---

## 🩺 Pemeliharaan & Troubleshooting

- **Melihat Log Backend**: `docker compose logs -f backend`
- **Melihat Log Frontend**: `docker compose logs -f frontend`
- **Restart Seluruh Layanan**: `docker compose restart`
- **Reset Data Demo via CLI**:
  ```bash
  docker compose exec backend node dist/database/seeds/seed.js
  ```
