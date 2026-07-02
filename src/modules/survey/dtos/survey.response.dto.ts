import { ApiProperty } from '@nestjs/swagger';
import { RespondentScope, SurveyStatus } from '../domain/survey.types';

/** Compact survey view returned by the mapper (used for the created/summary shape). */
export class SurveyDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty()
  titleVi!: string;

  @ApiProperty({ nullable: true })
  titleJa!: string | null;

  @ApiProperty({ enum: SurveyStatus })
  status!: SurveyStatus;

  @ApiProperty({ enum: RespondentScope })
  respondentScope!: RespondentScope;

  @ApiProperty({ description: 'Number of questions in the survey.' })
  questionCount!: number;
}
