import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { GetBudgetSummaryQuery } from './get-budget-summary.query';
import { BudgetSummaryDto } from './get-budget-summary.response.dto';

@ApiTags('budget')
@Controller({ path: 'events', version: '1' })
export class GetBudgetSummaryHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':eventId/budget')
  @ApiOperation({ summary: 'Budget summary', description: 'Planned vs actual totals and variance.' })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiOkResponse({ type: BudgetSummaryDto })
  @ApiStandardErrors(404)
  async summary(@Param('eventId') eventId: string): Promise<BudgetSummaryDto> {
    return this.queryBus.execute(new GetBudgetSummaryQuery({ eventId }));
  }
}
