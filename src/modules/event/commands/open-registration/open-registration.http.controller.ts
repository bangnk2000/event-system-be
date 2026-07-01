import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { OpenRegistrationCommand } from './open-registration.command';
import { OpenRegistrationResult } from './open-registration.service';
import { throwEventHttpError } from '../map-event-error';

@ApiTags('events')
@Controller({ path: 'events', version: '1' })
export class OpenRegistrationHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/open-registration')
  @ApiOperation({ summary: 'Open registration for a published event' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiStandardErrors(403, 404, 409)
  async open(
    @Param('id') id: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: OpenRegistrationResult = await this.commandBus.execute(
      new OpenRegistrationCommand({ eventId: id, actorId }),
    );
    return match(result, {
      Ok: (eventId: string) => new IdResponse(eventId),
      Err: (error: Error) => throwEventHttpError(error),
    });
  }
}
