import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { QuestionType, RespondentScope } from '../../domain/survey.types';

export class QuestionOptionRequestDto {
  @ApiProperty({ description: 'Stable key stored with the answer.', example: 'yes' })
  @IsString()
  @Length(1, 100)
  readonly key!: string;

  @ApiProperty({ example: 'Có' })
  @IsString()
  @Length(1, 500)
  readonly labelVi!: string;

  @ApiPropertyOptional({ example: 'はい' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  readonly labelJa?: string;
}

export class SurveyQuestionRequestDto {
  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  readonly type!: QuestionType;

  @ApiProperty({ description: 'Question text (Vietnamese).', example: 'Bạn hài lòng đến mức nào?' })
  @IsString()
  @Length(1, 1000)
  readonly promptVi!: string;

  @ApiPropertyOptional({ description: 'Question text (Japanese).' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  readonly promptJa?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  readonly required!: boolean;

  @ApiPropertyOptional({
    type: [QuestionOptionRequestDto],
    description: 'Required (≥2) for SINGLE_CHOICE / MULTIPLE_CHOICE; omit for RATING / TEXT.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionRequestDto)
  readonly options?: QuestionOptionRequestDto[];
}

export class CreateSurveyRequestDto {
  @ApiProperty({ example: 'Khảo sát sau sự kiện' })
  @IsString()
  @Length(1, 200)
  readonly titleVi!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  readonly titleJa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly descriptionVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly descriptionJa?: string;

  @ApiPropertyOptional({ enum: RespondentScope, default: RespondentScope.REGISTRANTS })
  @IsOptional()
  @IsEnum(RespondentScope)
  readonly respondentScope?: RespondentScope;

  @ApiProperty({ type: [SurveyQuestionRequestDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionRequestDto)
  readonly questions!: SurveyQuestionRequestDto[];
}
