import { MigrationInterface, QueryRunner } from 'typeorm';

/** Competition context (Phase 2): one row per tournament; competitors + matches stored as jsonb. */
export class AddTournaments1730000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tournaments" (
        "id" uuid PRIMARY KEY,
        "event_id" uuid NOT NULL,
        "name_vi" varchar(200) NOT NULL,
        "name_ja" varchar(200),
        "format" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL,
        "stage" varchar(20),
        "config" jsonb NOT NULL,
        "created_by" uuid NOT NULL,
        "competitors" jsonb NOT NULL,
        "matches" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tournaments_event" ON "tournaments" ("event_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tournaments";`);
  }
}
