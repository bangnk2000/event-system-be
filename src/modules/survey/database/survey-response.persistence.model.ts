import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

export interface SurveyAnswerRow {
  questionId: string;
  ratingValue: number | null;
  choiceKeys: string[] | null;
  textValue: string | null;
}

/**
 * DB row shape for an anonymous survey submission. No respondent identity is stored — only a
 * one-way HMAC token, unique per (survey, respondent), so duplicates are blocked without deanonymizing.
 */
@Entity({ name: 'survey_responses' })
@Unique('uq_survey_responses_survey_token', ['surveyId', 'respondentToken'])
export class SurveyResponseOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId!: string;

  @Column({ name: 'respondent_token', type: 'varchar', length: 64 })
  respondentToken!: string;

  @Column({ type: 'jsonb' })
  answers!: SurveyAnswerRow[];

  @Column({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
