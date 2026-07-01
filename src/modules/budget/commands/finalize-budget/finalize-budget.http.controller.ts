import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { FinalizeBudgetCommand } from './finalize-budget.command';
import { FinalizeBudgetResult } from './finalize-budget.service';
import { throwBudgetHttpError } from '../map-budget-error';

@ApiTags('budget')
@Controller({ path: 'budgets', version: '1' })
export class FinalizeBudgetHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':budgetId/finalize')
  @ApiOperation({ summary: 'Finalize a budget', description: 'Locks it; further edits return 409.' })
  @ApiParam({ name: 'budgetId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiStandardErrors(403, 404, 409)
  async finalize(
    @Param('budgetId') budgetId: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: FinalizeBudgetResult = await this.commandBus.execute(
      new FinalizeBudgetCommand({ budgetId, actorId }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwBudgetHttpError(error),
    });
  }
}
