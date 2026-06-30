import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { match } from 'oxide.ts';
import { ArgumentInvalidException } from '@libs/exceptions';
import { IdResponse } from '@libs/ddd';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { CreateEventCommand } from './create-event.command';
import { CreateEventRequestDto } from './create-event.request.dto';
import { CreateEventResult } from './create-event.service';
import { InvalidEventScheduleError } from '../../domain/event.errors';

@Controller({ path: 'events', version: '1' })
export class CreateEventHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(
    @Body() body: CreateEventRequestDto,
    @CurrentUserId() organizerId: string,
  ): Promise<IdResponse> {
    const command = new CreateEventCommand({
      organizerId,
      titleVi: body.titleVi,
      titleJa: body.titleJa,
      descriptionVi: body.descriptionVi,
      descriptionJa: body.descriptionJa,
      type: body.type,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      locationKind: body.locationKind,
      locationAddress: body.locationAddress,
      locationUrl: body.locationUrl,
      capacity: body.capacity ?? null,
      registrationMode: body.registrationMode,
      registrationDeadline: body.registrationDeadline
        ? new Date(body.registrationDeadline)
        : null,
    });

    const result: CreateEventResult = await this.commandBus.execute(command);

    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => {
        if (error instanceof InvalidEventScheduleError) {
          throw new ArgumentInvalidException(error.message); // -> 400
        }
        throw error; // unknown -> global filter -> 500
      },
    });
  }
}
