import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import { FinalizeBudgetCommand } from './finalize-budget.command';
import {
  BUDGET_REPOSITORY,
  BudgetRepositoryPort,
} from '../../application/ports/budget.repository.port';
import {
  BudgetFinalizedError,
  BudgetNotFoundError,
  NotBudgetOwnerError,
} from '../../domain/budget.errors';

export type FinalizeBudgetResult = Result<
  string,
  BudgetNotFoundError | NotBudgetOwnerError | BudgetFinalizedError
>;

@CommandHandler(FinalizeBudgetCommand)
export class FinalizeBudgetService
  implements ICommandHandler<FinalizeBudgetCommand, FinalizeBudgetResult>
{
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: BudgetRepositoryPort) {}

  async execute(command: FinalizeBudgetCommand): Promise<FinalizeBudgetResult> {
    const budget = await this.repo.findOneById(command.budgetId);
    if (!budget) return Err(new BudgetNotFoundError());
    if (!budget.isOwner(command.actorId)) return Err(new NotBudgetOwnerError());

    const result = budget.finalize(new Date());
    if (result.isErr()) return Err(result.unwrapErr());

    await this.repo.save(budget);
    return Ok(budget.id);
  }
}
