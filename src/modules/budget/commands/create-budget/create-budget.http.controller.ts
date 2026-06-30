import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { CreateBudgetCommand } from './create-budget.command';
import { CreateBudgetRequestDto } from './create-budget.request.dto';
import { CreateBudgetResult } from './create-budget.service';
import { throwBudgetHttpError } from '../map-budget-error';

@Controller({ path: 'events', version: '1' })
export class CreateBudgetHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':eventId/budget')
  async create(
    @Param('eventId') eventId: string,
    @Body() body: CreateBudgetRequestDto,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: CreateBudgetResult = await this.commandBus.execute(
      new CreateBudgetCommand({ eventId, actorId, currency: body.currency }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwBudgetHttpError(error),
    });
  }
}
