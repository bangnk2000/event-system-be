import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class AddBudgetItemRequestDto {
  @ApiProperty({ maxLength: 200, description: 'Line-item name.', example: 'Venue rental' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  readonly name!: string;

  @ApiProperty({ maxLength: 50, description: 'Category grouping.', example: 'Logistics' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly category!: string;

  @ApiProperty({ type: Number, minimum: 0, description: 'Planned amount in the budget currency.' })
  @IsNumber()
  @Min(0)
  readonly plannedAmount!: number;
}
