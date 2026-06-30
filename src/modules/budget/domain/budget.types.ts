import { BudgetItem } from './budget-item';

export enum BudgetStatus {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED', // quyết toán
}

export interface BudgetProps {
  eventId: string;
  ownerId: string; // the organizer who created the budget
  currency: string;
  status: BudgetStatus;
  items: BudgetItem[];
}
