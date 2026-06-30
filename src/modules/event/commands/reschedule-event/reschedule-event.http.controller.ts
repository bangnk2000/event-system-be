import { Body, Controller, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { RescheduleEventCommand } from './reschedule-event.command';
import { RescheduleEventRequestDto } from './reschedule-event.request.dto';
import { RescheduleEventResult } from './reschedule-event.service';
import { throwEventHttpError } from '../map-event-error';

@Controller({ path: 'events', version: '1' })
export class RescheduleEventHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/schedule')
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
