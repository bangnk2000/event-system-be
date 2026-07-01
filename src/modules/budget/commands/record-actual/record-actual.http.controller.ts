import { Body, Controller, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { RecordActualCommand } from './record-actual.command';
import { RecordActualRequestDto } from './record-actual.request.dto';
import { RecordActualResult } from './record-actual.service';
import { throwBudgetHttpError } from '../map-budget-error';

@ApiTags('budget')
@Controller({ path: 'budgets', version: '1' })
export class RecordActualHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':budgetId/items/:itemId/actual')
  @ApiOperation({ summary: 'Record the actual spend for a budget item' })
  @ApiParam({ name: 'budgetId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiStandardErrors(403, 404, 409)
  async record(
    @Param('budgetId') budgetId: string,
    @Param('itemId') itemId: string,
    @Body() body: RecordActualRequestDto,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: RecordActualResult = await this.commandBus.execute(
      new RecordActualCommand({
        budgetId,
        itemId,
        actorId,
        actualAmount: body.actualAmount,
        invoiceUrl: body.invoiceUrl,
      }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwBudgetHttpError(error),
    });
  }
}
