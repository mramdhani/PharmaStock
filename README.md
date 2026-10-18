# PharmaStock

Sistem manajemen inventaris farmasi berbasis **batch** dan **tanggal kedaluwarsa**.

| Layer     | Teknologi                     |
| --------- | ----------------------------- |
| Frontend  | Next.js, React, TypeScript    |
| Backend   | NestJS, TypeORM, Swagger      |
| Database  | PostgreSQL                    |
| Deploy    | Docker Compose + Caddy di VPS |

## Struktur Repo

```
pharmastock/
├── backend/    # NestJS REST API
├── frontend/   # Next.js
├── deploy/     # Caddyfile, script backup
└── docs/       # Blueprint, ERD, catatan belajar
```

## Dokumentasi

- [Blueprint](docs/blueprint.md)
- [Catatan Belajar](docs/learning-log.md)
