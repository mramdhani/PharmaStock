#!/bin/sh
set -e

echo "🚀 [PharmaStock] Memeriksa koneksi database..."

if [ "$AUTO_SEED" = "true" ]; then
  echo "🌱 [PharmaStock] Menjalankan migrasi & seeder data demo..."
  node dist/database/seeds/seed.js || echo "⚠️ Seeder selesai atau dilewati."
fi

echo "✨ [PharmaStock] Menjalankan server NestJS..."
exec "$@"
