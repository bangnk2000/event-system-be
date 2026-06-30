import { MigrationInterface, QueryRunner } from 'typeorm';

/** Participation context: registrations table. */
export class AddRegistrations1730000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "registrations" (
        "id" uuid PRIMARY KEY,
        "event_id" uuid NOT NULL,
        "mode" varchar(20) NOT NULL,
        "user_id" uuid NOT NULL,
        "team_name" varchar(200),
        "member_ids" jsonb NOT NULL,
        "status" varchar(20) NOT NULL,
        "checked_in_at" timestamptz,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_registrations_event" ON "registrations" ("event_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_registrations_user" ON "registrations" ("user_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "registrations";`);
  }
}
