import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGuestbookLogsTable1792348900000 implements MigrationInterface {
  name = 'CreateGuestbookLogsTable1792348900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "guestbook_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(150) NOT NULL,
        "organization" character varying(150),
        "note" text,
        "ip_address" character varying(100),
        "user_agent" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_guestbook_logs_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "guestbook_logs"`);
  }
}
