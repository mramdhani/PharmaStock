import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CreateGuestbookDto } from './dto/create-guestbook.dto';
import { Guestbook } from './entities/guestbook.entity';

@Injectable()
export class GuestbookService implements OnModuleInit {
  constructor(
    @InjectRepository(Guestbook)
    private readonly guestbookRepo: Repository<Guestbook>,
  ) {}

  async onModuleInit() {
    // 1. Tambahkan enum value 'SUPERADMIN' jika belum ada di database PostgreSQL
    try {
      await this.guestbookRepo.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE t.typname = 'users_role_enum' AND e.enumlabel = 'SUPERADMIN'
          ) THEN
            ALTER TYPE "users_role_enum" ADD VALUE 'SUPERADMIN';
          END IF;
        END $$;
      `);
    } catch {
      // ignore jika enum value sudah ada
    }

    // 2. Memastikan tabel guestbook_logs otomatis dibuat jika belum ada di PostgreSQL
    try {
      await this.guestbookRepo.query(`
        CREATE TABLE IF NOT EXISTS "guestbook_logs" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" character varying(150) NOT NULL,
          "organization" character varying(150),
          "note" text,
          "ip_address" character varying(100),
          "user_agent" text,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_guestbook_logs_id" PRIMARY KEY ("id")
        );
      `);
    } catch {
      // ignore
    }

    // 3. Pastikan akun Superadmin privat milik Tuan Ramdhani tersedia
    try {
      const superadminPassword = await bcrypt.hash('PharmaStock123!', 10);
      await this.guestbookRepo.query(`
        INSERT INTO "users" ("name", "email", "password_hash", "role", "is_active", "created_at", "updated_at")
        VALUES ('Muhammad Ramdani', 'tuan.ramdhani@gmail.com', '${superadminPassword}', 'SUPERADMIN', true, now(), now())
        ON CONFLICT ("email") DO UPDATE SET "role" = 'SUPERADMIN', "name" = 'Muhammad Ramdani';
      `);
    } catch {
      // ignore
    }
  }

  async create(
    dto: CreateGuestbookDto,
    clientIp?: string,
    userAgent?: string,
  ): Promise<Guestbook> {
    const entry = this.guestbookRepo.create({
      name: dto.name,
      organization: dto.organization || null,
      note: dto.note || null,
      ip_address: clientIp || null,
      user_agent: userAgent || null,
    });

    return await this.guestbookRepo.save(entry);
  }

  async findAll(): Promise<{ entries: Guestbook[]; total: number }> {
    const [entries, total] = await this.guestbookRepo.findAndCount({
      order: {
        created_at: 'DESC',
      },
      take: 100,
    });

    return { entries, total };
  }

  async remove(id: string): Promise<void> {
    const entry = await this.guestbookRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Data buku tamu tidak ditemukan');
    }
    await this.guestbookRepo.remove(entry);
  }
}
