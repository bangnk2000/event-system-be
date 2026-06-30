import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ParticipationMode } from '../../domain/registration.types';

export class RegisterForEventRequestDto {
  @IsIn(Object.values(ParticipationMode))
  readonly mode!: ParticipationMode;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly teamName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly memberIds?: string[];
}
