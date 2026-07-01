import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ParticipationMode } from '../../domain/registration.types';

export class RegisterForEventRequestDto {
  @ApiProperty({ enum: ParticipationMode, enumName: 'ParticipationMode', description: 'Individual or team registration.' })
  @IsIn(Object.values(ParticipationMode))
  readonly mode!: ParticipationMode;

  @ApiPropertyOptional({ maxLength: 200, description: 'Team name (required for TEAM mode).' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly teamName?: string;

  @ApiPropertyOptional({ type: [String], description: 'Team member user ids (TEAM mode).' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly memberIds?: string[];
}
