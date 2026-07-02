import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, RespondentScope, SurveyStatus } from '../../domain/survey.types';

export class RatingBucketView {
  @ApiProperty({ minimum: 1, maximum: 5 })
  rating!: number;

  @ApiProperty()
  count!: number;
}

export class ChoiceCountView {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  labelVi!: string;

  @ApiPropertyOptional({ nullable: true })
  labelJa!: string | null;

  @ApiProperty()
  count!: number;
}

export class QuestionResultView {
  @ApiProperty({ format: 'uuid' })
  questionId!: string;

  @ApiProperty({ enum: QuestionType })
  type!: QuestionType;

  @ApiProperty()
  promptVi!: string;

  @ApiPropertyOptional({ nullable: true })
  promptJa!: string | null;

  @ApiProperty()
  required!: boolean;

  @ApiProperty({ description: 'Number of responses that answered this question.' })
  answerCount!: number;

  @ApiPropertyOptional({ nullable: true, description: 'Mean rating (RATING only).' })
  average!: number | null;

  @ApiPropertyOptional({ type: [RatingBucketView], description: 'Rating distribution (RATING only).' })
  distribution?: RatingBucketView[];

  @ApiPropertyOptional({ type: [ChoiceCountView], description: 'Votes per option (choice only).' })
  options?: ChoiceCountView[];

  @ApiPropertyOptional({ type: [String], description: 'Free-text answers (TEXT only).' })
  textAnswers?: string[];
}

export class SurveyResultsDto {
  @ApiProperty({ format: 'uuid' })
  surveyId!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty({ enum: SurveyStatus })
  status!: SurveyStatus;

  @ApiProperty({ enum: RespondentScope })
  respondentScope!: RespondentScope;

  @ApiProperty({ description: 'Number of submitted responses.' })
  responded!: number;

  @ApiProperty({ description: 'Number of people in the respondent scope (rate denominator).' })
  eligible!: number;

  @ApiProperty({ description: 'responded / eligible, 2 decimals (0 when eligible is 0).' })
  responseRate!: number;

  @ApiProperty({ type: [QuestionResultView] })
  questions!: QuestionResultView[];
}
