import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { CreateBudgetCommand } from './create-budget.command';
import { CreateBudgetRequestDto } from './create-budget.request.dto';
import { CreateBudgetResult } from './create-budget.service';
import { throwBudgetHttpError } from '../map-budget-error';

@ApiTags('budget')
@Controller({ path: 'events', version: '1' })
export class CreateBudgetHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':eventId/budget')
  @ApiOperation({
    summary: 'Create the budget for an event',
    description: 'Authorized via cross-context organizer check; only organizers may create it.',
  })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto, description: 'Budget created; returns the budget id.' })
  @ApiStandardErrors(403, 404, 409)
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
