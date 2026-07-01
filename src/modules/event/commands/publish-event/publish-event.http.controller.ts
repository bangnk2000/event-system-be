import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { PublishEventCommand } from './publish-event.command';
import { PublishEventResult } from './publish-event.service';
import { throwEventHttpError } from '../map-event-error';

@ApiTags('events')
@Controller({ path: 'events', version: '1' })
export class PublishEventHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a draft event' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiStandardErrors(403, 404, 409)
  async publish(
    @Param('id') id: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: PublishEventResult = await this.commandBus.execute(
      new PublishEventCommand({ eventId: id, actorId }),
    );
    return match(result, {
      Ok: (eventId: string) => new IdResponse(eventId),
      Err: (error: Error) => throwEventHttpError(error),
    });
  }
}
