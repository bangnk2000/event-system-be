import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelEventRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly reason?: string;
}
