import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import {
  EventBudgetSummary,
  GetEventBudgetSummaryQuery,
} from '@libs/contracts/budget/get-event-budget-summary.query';
import { BudgetOrmEntity } from '../../database/budget.persistence.model';

/**
 * Answers the cross-context contract query for the event report — read side, straight from the DB.
 * A missing budget yields `exists: false` with zeroed totals rather than a 404.
 */
@QueryHandler(GetEventBudgetSummaryQuery)
export class GetEventBudgetSummaryQueryHandler
  implements IQueryHandler<GetEventBudgetSummaryQuery, EventBudgetSummary>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetEventBudgetSummaryQuery): Promise<EventBudgetSummary> {
    const row = await this.dataSource
      .getRepository(BudgetOrmEntity)
      .findOne({ where: { eventId: query.eventId } });

    if (!row) {
      return {
        exists: false,
        currency: null,
        status: null,
        totalPlanned: 0,
        totalActual: 0,
        variance: 0,
      };
    }

    const totalPlanned = row.items.reduce((sum, item) => sum + item.plannedAmount, 0);
    const totalActual = row.items.reduce((sum, item) => sum + item.actualAmount, 0);

    return {
      exists: true,
      currency: row.currency,
      status: row.status,
      totalPlanned,
      totalActual,
      variance: totalPlanned - totalActual,
    };
  }
}
