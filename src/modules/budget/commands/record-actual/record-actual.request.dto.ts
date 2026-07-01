import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RecordActualRequestDto {
  @ApiProperty({ type: Number, minimum: 0, description: 'Actual amount spent for this line item.' })
  @IsNumber()
  @Min(0)
  readonly actualAmount!: number;

  @ApiPropertyOptional({ maxLength: 1000, description: 'URL of the supporting invoice/receipt.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  readonly invoiceUrl?: string;
}
