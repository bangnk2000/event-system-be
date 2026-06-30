import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { CancelRegistrationCommand } from './cancel-registration.command';
import { CancelRegistrationResult } from './cancel-registration.service';
import { throwRegistrationHttpError } from '../map-registration-error';

@Controller({ path: 'registrations', version: '1' })
export class CancelRegistrationHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: CancelRegistrationResult = await this.commandBus.execute(
      new CancelRegistrationCommand({ registrationId: id, actorId }),
    );
    return match(result, {
      Ok: (regId: string) => new IdResponse(regId),
      Err: (error: Error) => throwRegistrationHttpError(error),
    });
  }
}
