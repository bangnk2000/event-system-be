import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, RespondentScope, SurveyStatus } from '../../domain/survey.types';

export class SurveyOptionView {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  labelVi!: string;

  @ApiPropertyOptional({ nullable: true })
  labelJa!: string | null;
}

export class SurveyQuestionView {
  @ApiProperty({ format: 'uuid' })
  questionId!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty({ enum: QuestionType })
  type!: QuestionType;

  @ApiProperty()
  promptVi!: string;

  @ApiPropertyOptional({ nullable: true })
  promptJa!: string | null;

  @ApiProperty()
  required!: boolean;

  @ApiProperty({ type: [SurveyOptionView] })
  options!: SurveyOptionView[];
}

export class SurveyDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty()
  titleVi!: string;

  @ApiPropertyOptional({ nullable: true })
  titleJa!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionJa!: string | null;

  @ApiProperty({ enum: SurveyStatus })
  status!: SurveyStatus;

  @ApiProperty({ enum: RespondentScope })
  respondentScope!: RespondentScope;

  @ApiProperty({ type: [SurveyQuestionView] })
  questions!: SurveyQuestionView[];
}
