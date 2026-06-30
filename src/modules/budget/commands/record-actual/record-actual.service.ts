import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import { RecordActualCommand } from './record-actual.command';
import { Money } from '../../domain/value-objects/money.value-object';
import {
  BUDGET_REPOSITORY,
  BudgetRepositoryPort,
} from '../../application/ports/budget.repository.port';
import {
  BudgetFinalizedError,
  BudgetItemNotFoundError,
  BudgetNotFoundError,
  NotBudgetOwnerError,
} from '../../domain/budget.errors';

export type RecordActualResult = Result<
  string,
  BudgetNotFoundError | NotBudgetOwnerError | BudgetFinalizedError | BudgetItemNotFoundError
>;

@CommandHandler(RecordActualCommand)
export class RecordActualService
  implements ICommandHandler<RecordActualCommand, RecordActualResult>
{
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: BudgetRepositoryPort) {}

  async execute(command: RecordActualCommand): Promise<RecordActualResult> {
    const budget = await this.repo.findOneById(command.budgetId);
    if (!budget) return Err(new BudgetNotFoundError());
    if (!budget.isOwner(command.actorId)) return Err(new NotBudgetOwnerError());

    const actual = Money.create(command.actualAmount, budget.currency);
    const result = budget.recordActual(
      command.itemId,
      actual,
      command.invoiceUrl ?? null,
      new Date(),
    );
    if (result.isErr()) return Err(result.unwrapErr());

    await this.repo.save(budget);
    return Ok(budget.id);
  }
}
