import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { OpenRegistrationCommand } from './open-registration.command';
import { OpenRegistrationResult } from './open-registration.service';
import { throwEventHttpError } from '../map-event-error';

@Controller({ path: 'events', version: '1' })
export class OpenRegistrationHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/open-registration')
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
