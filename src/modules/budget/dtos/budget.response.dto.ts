export class BudgetResponseDto {
  id!: string;
  eventId!: string;
  currency!: string;
  status!: string;
  totalPlanned!: number;
  totalActual!: number;
}
