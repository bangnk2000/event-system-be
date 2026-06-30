import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import { AddBudgetItemCommand } from './add-budget-item.command';
import { Money } from '../../domain/value-objects/money.value-object';
import {
  BUDGET_REPOSITORY,
  BudgetRepositoryPort,
} from '../../application/ports/budget.repository.port';
import {
  BudgetFinalizedError,
  BudgetNotFoundError,
  NotBudgetOwnerError,
} from '../../domain/budget.errors';

export type AddBudgetItemResult = Result<
  string,
  BudgetNotFoundError | NotBudgetOwnerError | BudgetFinalizedError
>;

@CommandHandler(AddBudgetItemCommand)
export class AddBudgetItemService
  implements ICommandHandler<AddBudgetItemCommand, AddBudgetItemResult>
{
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: BudgetRepositoryPort) {}

  async execute(command: AddBudgetItemCommand): Promise<AddBudgetItemResult> {
    const budget = await this.repo.findOneById(command.budgetId);
    if (!budget) return Err(new BudgetNotFoundError());
    if (!budget.isOwner(command.actorId)) return Err(new NotBudgetOwnerError());

    const itemId = this.repo.nextId();
    const planned = Money.create(command.plannedAmount, budget.currency);
    const result = budget.addItem(itemId, command.name, command.category, planned, new Date());
    if (result.isErr()) return Err(result.unwrapErr());

    await this.repo.save(budget);
    return Ok(itemId);
  }
}
