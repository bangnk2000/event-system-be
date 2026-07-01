import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateBudgetRequestDto {
  @ApiPropertyOptional({ minLength: 3, maxLength: 10, description: 'ISO currency code (default VND).', example: 'VND' })
  @IsOptional()
  @IsString()
  @Length(3, 10)
  readonly currency?: string;
}
