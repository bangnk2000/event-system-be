import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RespondentScope, SurveyStatus } from '../../domain/survey.types';

export class SurveyListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  titleVi!: string;

  @ApiPropertyOptional({ nullable: true })
  titleJa!: string | null;

  @ApiProperty({ enum: SurveyStatus })
  status!: SurveyStatus;

  @ApiProperty({ enum: RespondentScope })
  respondentScope!: RespondentScope;

  @ApiProperty()
  questionCount!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}
