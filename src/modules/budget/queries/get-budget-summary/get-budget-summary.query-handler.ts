import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@libs/exceptions';
import { GetBudgetSummaryQuery } from './get-budget-summary.query';
import { BudgetSummaryDto } from './get-budget-summary.response.dto';
import { BudgetOrmEntity } from '../../database/budget.persistence.model';

/** Read side: budget summary with planned vs actual totals + variance, straight from the DB. */
@QueryHandler(GetBudgetSummaryQuery)
export class GetBudgetSummaryQueryHandler
  implements IQueryHandler<GetBudgetSummaryQuery, BudgetSummaryDto>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetBudgetSummaryQuery): Promise<BudgetSummaryDto> {
    const row = await this.dataSource
      .getRepository(BudgetOrmEntity)
      .findOne({ where: { eventId: query.eventId } });
    if (!row) throw new NotFoundException('Budget not found for this event');

    const totalPlanned = row.items.reduce((sum, item) => sum + item.plannedAmount, 0);
    const totalActual = row.items.reduce((sum, item) => sum + item.actualAmount, 0);

    return {
      budgetId: row.id,
      eventId: row.eventId,
      currency: row.currency,
      status: row.status,
      totalPlanned,
      totalActual,
      variance: totalPlanned - totalActual,
      items: row.items.map((item) => ({
        itemId: item.itemId,
        name: item.name,
        category: item.category,
        plannedAmount: item.plannedAmount,
        actualAmount: item.actualAmount,
        invoiceUrl: item.invoiceUrl,
      })),
    };
  }
}
