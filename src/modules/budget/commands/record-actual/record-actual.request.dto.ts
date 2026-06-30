import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RecordActualRequestDto {
  @IsNumber()
  @Min(0)
  readonly actualAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  readonly invoiceUrl?: string;
}
