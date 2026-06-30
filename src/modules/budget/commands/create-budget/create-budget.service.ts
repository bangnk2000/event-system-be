import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { CreateBudgetCommand } from './create-budget.command';
import { BudgetEntity } from '../../domain/budget.entity';
import {
  BUDGET_REPOSITORY,
  BudgetRepositoryPort,
} from '../../application/ports/budget.repository.port';
import {
  BudgetAlreadyExistsError,
  BudgetEventNotFoundError,
  NotEventOrganizerError,
} from '../../domain/budget.errors';

export type CreateBudgetResult = Result<
  string,
  BudgetEventNotFoundError | NotEventOrganizerError | BudgetAlreadyExistsError
>;

@CommandHandler(CreateBudgetCommand)
export class CreateBudgetService
  implements ICommandHandler<CreateBudgetCommand, CreateBudgetResult>
{
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly repo: BudgetRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateBudgetCommand): Promise<CreateBudgetResult> {
    // Cross-context authorization — ask the `event` context over the QueryBus (no module import).
    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: command.eventId, userId: command.actorId }),
    );
    if (!check.eventExists) return Err(new BudgetEventNotFoundError());
    if (!check.isOrganizer) return Err(new NotEventOrganizerError());

    const existing = await this.repo.findByEventId(command.eventId);
    if (existing) return Err(new BudgetAlreadyExistsError());

    const budget = BudgetEntity.create(
      command.eventId,
      command.actorId,
      command.currency ?? 'VND',
      this.repo.nextId(),
      new Date(),
    );
    await this.repo.insert(budget);
    return Ok(budget.id);
  }
}
