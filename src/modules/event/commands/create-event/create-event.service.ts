import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import { CreateEventCommand } from './create-event.command';
import { EventEntity } from '../../domain/event.entity';
import { EventLocation } from '../../domain/event.types';
import { MultilingualText } from '../../domain/value-objects/multilingual-text.value-object';
import { DateTimeRange } from '../../domain/value-objects/date-time-range.value-object';
import { RegistrationPolicy } from '../../domain/value-objects/registration-policy.value-object';
import { InvalidEventScheduleError } from '../../domain/event.errors';
import {
  EVENT_REPOSITORY,
  EventRepositoryPort,
} from '../../application/ports/event.repository.port';

export type CreateEventResult = Result<string, InvalidEventScheduleError>;

@CommandHandler(CreateEventCommand)
export class CreateEventService
  implements ICommandHandler<CreateEventCommand, CreateEventResult>
{
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepo: EventRepositoryPort,
  ) {}

  async execute(command: CreateEventCommand): Promise<CreateEventResult> {
    // Value objects throw ArgumentInvalidException on malformed input -> 400 via the global filter.
    const schedule = DateTimeRange.create(command.startAt, command.endAt);
    const registrationPolicy = RegistrationPolicy.create(
      command.registrationMode,
      command.registrationDeadline ?? null,
    );

    // Cross-field business rule -> RETURNED as Result (recoverable, documented in the return type).
    const deadline = registrationPolicy.deadline;
    if (deadline && deadline.getTime() > schedule.startAt.getTime()) {
      return Err(new InvalidEventScheduleError());
    }

    const location: EventLocation | null = command.locationKind
      ? {
          kind: command.locationKind,
          address: command.locationAddress,
          url: command.locationUrl,
        }
      : null;

    const event = EventEntity.draft(
      {
        title: MultilingualText.create(command.titleVi, command.titleJa),
        description: command.descriptionVi
          ? MultilingualText.create(command.descriptionVi, command.descriptionJa)
          : null,
        type: command.type,
        schedule,
        location,
        capacity: command.capacity ?? null,
        registrationPolicy,
      },
      command.organizerId,
      this.eventRepo.nextId(),
      new Date(), // injected at the edge; the domain never reads the clock
    );

    await this.eventRepo.insert(event); // persists + writes EventDrafted to the outbox in one txn
    return Ok(event.id);
  }
}
