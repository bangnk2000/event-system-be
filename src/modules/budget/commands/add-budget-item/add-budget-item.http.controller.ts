import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { AddBudgetItemCommand } from './add-budget-item.command';
import { AddBudgetItemRequestDto } from './add-budget-item.request.dto';
import { AddBudgetItemResult } from './add-budget-item.service';
import { throwBudgetHttpError } from '../map-budget-error';

@Controller({ path: 'budgets', version: '1' })
export class AddBudgetItemHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':budgetId/items')
  async addItem(
    @Param('budgetId') budgetId: string,
    @Body() body: AddBudgetItemRequestDto,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: AddBudgetItemResult = await this.commandBus.execute(
      new AddBudgetItemCommand({
        budgetId,
        actorId,
        name: body.name,
        category: body.category,
        plannedAmount: body.plannedAmount,
      }),
    );
    return match(result, {
      Ok: (itemId: string) => new IdResponse(itemId),
      Err: (error: Error) => throwBudgetHttpError(error),
    });
  }
}
