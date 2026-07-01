import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelEventRequestDto {
  @ApiPropertyOptional({ maxLength: 500, description: 'Reason shown to registrants.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly reason?: string;
}
