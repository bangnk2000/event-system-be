export class BudgetItemDto {
  itemId!: string;
  name!: string;
  category!: string;
  plannedAmount!: number;
  actualAmount!: number;
  invoiceUrl!: string | null;
}

export class BudgetSummaryDto {
  budgetId!: string;
  eventId!: string;
  currency!: string;
  status!: string;
  totalPlanned!: number;
  totalActual!: number;
  variance!: number; // planned - actual
  items!: BudgetItemDto[];
}
