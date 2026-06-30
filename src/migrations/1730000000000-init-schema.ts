import { MigrationInterface, QueryRunner } from 'typeorm';

/** Initial schema: events + transactional outbox. Mirrors the TypeORM entities (dev uses synchronize). */
export class InitSchema1730000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "events" (
        "id" uuid PRIMARY KEY,
        "title_vi" varchar(200) NOT NULL,
        "title_ja" varchar(200),
        "description_vi" text,
        "description_ja" text,
        "type" varchar(50) NOT NULL,
        "status" varchar(50) NOT NULL,
        "start_at" timestamptz NOT NULL,
        "end_at" timestamptz NOT NULL,
        "location" jsonb,
        "capacity" integer,
        "registration_mode" varchar(20) NOT NULL,
        "registration_deadline" timestamptz,
        "committee" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_events_status" ON "events" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_events_start_at" ON "events" ("start_at");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "outbox_messages" (
        "id" uuid PRIMARY KEY,
        "aggregate_id" uuid NOT NULL,
        "event_name" varchar(200) NOT NULL,
        "payload" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL,
        "processed_at" timestamptz
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_outbox_aggregate" ON "outbox_messages" ("aggregate_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_outbox_processed_at" ON "outbox_messages" ("processed_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "outbox_messages";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "events";`);
  }
}
