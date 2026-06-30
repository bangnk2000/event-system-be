import { RepositoryPort } from '@libs/ddd';
import { BudgetEntity } from '../../domain/budget.entity';

export const BUDGET_REPOSITORY = Symbol('BUDGET_REPOSITORY');

export interface BudgetRepositoryPort extends RepositoryPort<BudgetEntity> {
  findByEventId(eventId: string): Promise<BudgetEntity | null>;
}
