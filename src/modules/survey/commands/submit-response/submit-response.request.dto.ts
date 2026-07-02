import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class SurveyAnswerRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Id of the question being answered.' })
  @IsString()
  readonly questionId!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: 'For RATING questions.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  readonly ratingValue?: number;

  @ApiPropertyOptional({ type: [String], description: 'Selected option key(s) for choice questions.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly choiceKeys?: string[];

  @ApiPropertyOptional({ description: 'For TEXT questions.' })
  @IsOptional()
  @IsString()
  @Length(1, 5000)
  readonly textValue?: string;
}

export class SubmitResponseRequestDto {
  @ApiProperty({ type: [SurveyAnswerRequestDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerRequestDto)
  readonly answers!: SurveyAnswerRequestDto[];
}
