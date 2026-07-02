import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { QuestionType, RespondentScope, SurveyStatus } from '../domain/survey.types';

export interface QuestionOptionRow {
  key: string;
  labelVi: string;
  labelJa: string | null;
}

export interface SurveyQuestionRow {
  questionId: string;
  order: number;
  type: QuestionType;
  promptVi: string;
  promptJa: string | null;
  required: boolean;
  options: QuestionOptionRow[];
}

/** DB row shape — SEPARATE from the domain entity; bridged only by survey.mapper.ts. */
@Entity({ name: 'surveys' })
export class SurveyOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ name: 'title_vi', type: 'varchar', length: 200 })
  titleVi!: string;

  @Column({ name: 'title_ja', type: 'varchar', length: 200, nullable: true })
  titleJa!: string | null;

  @Column({ name: 'description_vi', type: 'text', nullable: true })
  descriptionVi!: string | null;

  @Column({ name: 'description_ja', type: 'text', nullable: true })
  descriptionJa!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: SurveyStatus;

  @Column({ name: 'respondent_scope', type: 'varchar', length: 20 })
  respondentScope!: RespondentScope;

  @Column({ type: 'jsonb' })
  questions!: SurveyQuestionRow[];

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
