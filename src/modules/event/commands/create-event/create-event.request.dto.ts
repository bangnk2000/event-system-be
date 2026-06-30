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
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  readonly titleVi!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly titleJa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly descriptionVi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly descriptionJa?: string;

  @IsIn(Object.values(EventType))
  readonly type!: EventType;

  @IsISO8601()
  readonly startAt!: string;

  @IsISO8601()
  readonly endAt!: string;

  @IsOptional()
  @IsIn(['ONLINE', 'OFFLINE'])
  readonly locationKind?: 'ONLINE' | 'OFFLINE';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  readonly locationAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly locationUrl?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  readonly capacity?: number;

  @IsIn(Object.values(RegistrationMode))
  readonly registrationMode!: RegistrationMode;

  @IsOptional()
  @IsISO8601()
  readonly registrationDeadline?: string;
}
