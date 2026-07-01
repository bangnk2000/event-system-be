import { Body, Controller, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { RescheduleEventCommand } from './reschedule-event.command';
import { RescheduleEventRequestDto } from './reschedule-event.request.dto';
import { RescheduleEventResult } from './reschedule-event.service';
import { throwEventHttpError } from '../map-event-error';

@ApiTags('events')
@Controller({ path: 'events', version: '1' })
export class RescheduleEventHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/schedule')
  @ApiOperation({
    summary: 'Reschedule an event',
    description: 'If registration is open it is auto-closed then reopened around the change.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiStandardErrors(400, 403, 404, 409)
  async reschedule(
    @Param('id') id: string,
    @Body() body: RescheduleEventRequestDto,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: RescheduleEventResult = await this.commandBus.execute(
      new RescheduleEventCommand({
        eventId: id,
        actorId,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
      }),
    );
    return match(result, {
      Ok: (eventId: string) => new IdResponse(eventId),
      Err: (error: Error) => throwEventHttpError(error),
    });
  }
}
