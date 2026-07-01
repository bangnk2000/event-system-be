import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EventType } from '../../domain/event.types';
import { RegistrationMode } from '../../domain/value-objects/registration-policy.value-object';

export class CreateEventRequestDto {
  @ApiProperty({ maxLength: 200, description: 'Vietnamese title (required).', example: 'Hội thảo nội bộ Q3' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  readonly titleVi!: string;

  @ApiPropertyOptional({ maxLength: 200, description: 'Japanese title.', example: '社内セミナー Q3' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly titleJa?: string;

  @ApiPropertyOptional({ maxLength: 2000, description: 'Vietnamese description.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly descriptionVi?: string;

  @ApiPropertyOptional({ maxLength: 2000, description: 'Japanese description.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly descriptionJa?: string;

  @ApiProperty({ enum: EventType, enumName: 'EventType', description: 'Kind of event.' })
  @IsIn(Object.values(EventType))
  readonly type!: EventType;

  @ApiProperty({ format: 'date-time', description: 'Start (ISO 8601).', example: '2026-08-01T09:00:00.000Z' })
  @IsISO8601()
  readonly startAt!: string;

  @ApiProperty({ format: 'date-time', description: 'End (ISO 8601), must be after start.', example: '2026-08-01T12:00:00.000Z' })
  @IsISO8601()
  readonly endAt!: string;

  @ApiPropertyOptional({ enum: ['ONLINE', 'OFFLINE'], description: 'Location kind.' })
  @IsOptional()
  @IsIn(['ONLINE', 'OFFLINE'])
  readonly locationKind?: 'ONLINE' | 'OFFLINE';

  @ApiPropertyOptional({ maxLength: 300, description: 'Physical address (OFFLINE).' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  readonly locationAddress?: string;

  @ApiPropertyOptional({ maxLength: 500, description: 'Meeting URL (ONLINE).' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly locationUrl?: string;

  @ApiPropertyOptional({ type: Number, minimum: 1, description: 'Max participants; omit for unlimited.' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  readonly capacity?: number;

  @ApiProperty({ enum: RegistrationMode, enumName: 'RegistrationMode', description: 'How people register.' })
  @IsIn(Object.values(RegistrationMode))
  readonly registrationMode!: RegistrationMode;

  @ApiPropertyOptional({ format: 'date-time', description: 'Registration deadline (ISO 8601).' })
  @IsOptional()
  @IsISO8601()
  readonly registrationDeadline?: string;
}
