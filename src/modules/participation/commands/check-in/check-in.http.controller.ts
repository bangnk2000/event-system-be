import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { CheckInCommand } from './check-in.command';
import { CheckInResult } from './check-in.service';
import { throwRegistrationHttpError } from '../map-registration-error';

@ApiTags('participation')
@Controller({ path: 'registrations', version: '1' })
export class CheckInHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check in a registration', description: 'Idempotency: double check-in returns 409.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiStandardErrors(403, 404, 409)
  async checkIn(
    @Param('id') id: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: CheckInResult = await this.commandBus.execute(
      new CheckInCommand({ registrationId: id, actorId }),
    );
    return match(result, {
      Ok: (regId: string) => new IdResponse(regId),
      Err: (error: Error) => throwRegistrationHttpError(error),
    });
  }
}
