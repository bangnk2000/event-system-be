import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { CancelEventCommand } from './cancel-event.command';
import { CancelEventRequestDto } from './cancel-event.request.dto';
import { CancelEventResult } from './cancel-event.service';
import { throwEventHttpError } from '../map-event-error';

@ApiTags('events')
@Controller({ path: 'events', version: '1' })
export class CancelEventHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an event' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiStandardErrors(403, 404, 409)
  async cancel(
    @Param('id') id: string,
    @Body() body: CancelEventRequestDto,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: CancelEventResult = await this.commandBus.execute(
      new CancelEventCommand({ eventId: id, actorId, reason: body.reason ?? '' }),
    );
    return match(result, {
      Ok: (eventId: string) => new IdResponse(eventId),
      Err: (error: Error) => throwEventHttpError(error),
    });
  }
}
