import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class GetEventListRequestDto {
  @ApiPropertyOptional({ enum: ['vi', 'ja'], description: 'Language for localized titles (default vi).' })
  @IsOptional()
  @IsIn(['vi', 'ja'])
  readonly lang?: 'vi' | 'ja';
}
