import { IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class AddBudgetItemRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  readonly name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly category!: string;

  @IsNumber()
  @Min(0)
  readonly plannedAmount!: number;
}
