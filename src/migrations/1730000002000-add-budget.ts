import { MigrationInterface, QueryRunner } from 'typeorm';

/** Budget context: one budget per event, line items stored as jsonb. */
export class AddBudget1730000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budgets" (
        "id" uuid PRIMARY KEY,
        "event_id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        "currency" varchar(10) NOT NULL,
        "status" varchar(20) NOT NULL,
        "items" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_budgets_event" ON "budgets" ("event_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "budgets";`);
  }
}
