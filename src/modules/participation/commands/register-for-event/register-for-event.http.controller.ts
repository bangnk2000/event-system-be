import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { RegisterForEventCommand } from './register-for-event.command';
import { RegisterForEventRequestDto } from './register-for-event.request.dto';
import { RegisterForEventResult } from './register-for-event.service';
import { throwRegistrationHttpError } from '../map-registration-error';

@ApiTags('participation')
@Controller({ path: 'events', version: '1' })
export class RegisterForEventHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':eventId/registrations')
  @ApiOperation({
    summary: 'Register for an event',
    description: 'Individual or team. Fails if the event is not open for registration.',
  })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto, description: 'Registration created; returns its id.' })
  @ApiStandardErrors(400, 404, 409)
  async register(
    @Param('eventId') eventId: string,
    @Body() body: RegisterForEventRequestDto,
    @CurrentUserId() userId: string,
  ): Promise<IdResponse> {
    const result: RegisterForEventResult = await this.commandBus.execute(
      new RegisterForEventCommand({
        eventId,
        userId,
        mode: body.mode,
        teamName: body.teamName,
        memberIds: body.memberIds,
      }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwRegistrationHttpError(error),
    });
  }
}
