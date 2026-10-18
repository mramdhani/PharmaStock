#!/bin/sh
set -e

echo "🚀 [PharmaStock] Memeriksa koneksi database dan menjalankan migrasi..."
npx typeorm migration:run -d dist/database/data-source.js || echo "⚠️ Migrasi sudah up-to-date atau dilewati."

if [ "$AUTO_SEED" = "true" ]; then
  echo "🌱 [PharmaStock] Menjalankan seeder otomatis data demo..."
  node dist/database/seeds/seed.js || echo "⚠️ Seeder dilewati."
fi

echo "✨ [PharmaStock] Menjalankan server NestJS..."
exec "$@"
