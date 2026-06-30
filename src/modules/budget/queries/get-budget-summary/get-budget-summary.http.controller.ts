import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetBudgetSummaryQuery } from './get-budget-summary.query';
import { BudgetSummaryDto } from './get-budget-summary.response.dto';

@Controller({ path: 'events', version: '1' })
export class GetBudgetSummaryHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':eventId/budget')
  async summary(@Param('eventId') eventId: string): Promise<BudgetSummaryDto> {
    return this.queryBus.execute(new GetBudgetSummaryQuery({ eventId }));
  }
}
