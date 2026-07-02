import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Survey context: post-event surveys (questions stored as jsonb) + anonymous responses.
 * Responses store only an HMAC token (unique per survey+respondent) — no respondent identity.
 */
export class AddSurveys1730000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "surveys" (
        "id" uuid PRIMARY KEY,
        "event_id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        "title_vi" varchar(200) NOT NULL,
        "title_ja" varchar(200),
        "description_vi" text,
        "description_ja" text,
        "status" varchar(20) NOT NULL,
        "respondent_scope" varchar(20) NOT NULL,
        "questions" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_surveys_event" ON "surveys" ("event_id");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "survey_responses" (
        "id" uuid PRIMARY KEY,
        "survey_id" uuid NOT NULL,
        "respondent_token" varchar(64) NOT NULL,
        "answers" jsonb NOT NULL,
        "submitted_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_survey_responses_survey" ON "survey_responses" ("survey_id");`,
    );
    // One response per (survey, respondent) — blocks duplicates without storing identity.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_survey_responses_survey_token" ON "survey_responses" ("survey_id", "respondent_token");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_responses";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "surveys";`);
  }
}
