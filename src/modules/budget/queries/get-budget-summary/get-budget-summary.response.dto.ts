import { ApiProperty } from '@nestjs/swagger';

export class BudgetItemDto {
  @ApiProperty({ format: 'uuid' })
  itemId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ type: Number })
  plannedAmount!: number;

  @ApiProperty({ type: Number })
  actualAmount!: number;

  @ApiProperty({ nullable: true, description: 'Invoice/receipt URL, if recorded.' })
  invoiceUrl!: string | null;
}

export class BudgetSummaryDto {
  @ApiProperty({ format: 'uuid' })
  budgetId!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty({ description: 'Budget currency code.' })
  currency!: string;

  @ApiProperty({ description: 'DRAFT or FINALIZED.' })
  status!: string;

  @ApiProperty({ type: Number, description: 'Sum of planned amounts.' })
  totalPlanned!: number;

  @ApiProperty({ type: Number, description: 'Sum of actual amounts.' })
  totalActual!: number;

  @ApiProperty({ type: Number, description: 'Planned minus actual (positive = under budget).' })
  variance!: number;

  @ApiProperty({ type: [BudgetItemDto] })
  items!: BudgetItemDto[];
}
