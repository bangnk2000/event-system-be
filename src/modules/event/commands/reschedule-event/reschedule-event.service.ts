import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import { RescheduleEventCommand } from './reschedule-event.command';
import { DateTimeRange } from '../../domain/value-objects/date-time-range.value-object';
import {
  EVENT_REPOSITORY,
  EventRepositoryPort,
} from '../../application/ports/event.repository.port';
import {
  EventNotFoundError,
  InvalidEventScheduleError,
  InvalidEventStateError,
  NotOrganizerError,
} from '../../domain/event.errors';

export type RescheduleEventResult = Result<
  string,
  EventNotFoundError | NotOrganizerError | InvalidEventStateError | InvalidEventScheduleError
>;

@CommandHandler(RescheduleEventCommand)
export class RescheduleEventService
  implements ICommandHandler<RescheduleEventCommand, RescheduleEventResult>
{
  constructor(@Inject(EVENT_REPOSITORY) private readonly repo: EventRepositoryPort) {}

  async execute(command: RescheduleEventCommand): Promise<RescheduleEventResult> {
    const event = await this.repo.findOneById(command.eventId);
    if (!event) return Err(new EventNotFoundError());
    if (!event.isOrganizer(command.actorId)) return Err(new NotOrganizerError());

    // VO throws ArgumentInvalidException on a malformed range -> 400 via the global filter.
    const newRange = DateTimeRange.create(command.startAt, command.endAt);

    const transition = event.reschedule(newRange, new Date());
    if (transition.isErr()) return Err(transition.unwrapErr());

    await this.repo.save(event);
    return Ok(event.id);
  }
}
