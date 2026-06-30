import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import { CancelEventCommand } from './cancel-event.command';
import {
  EVENT_REPOSITORY,
  EventRepositoryPort,
} from '../../application/ports/event.repository.port';
import {
  EventNotFoundError,
  InvalidEventStateError,
  NotOrganizerError,
} from '../../domain/event.errors';

export type CancelEventResult = Result<
  string,
  EventNotFoundError | NotOrganizerError | InvalidEventStateError
>;

@CommandHandler(CancelEventCommand)
export class CancelEventService
  implements ICommandHandler<CancelEventCommand, CancelEventResult>
{
  constructor(@Inject(EVENT_REPOSITORY) private readonly repo: EventRepositoryPort) {}

  async execute(command: CancelEventCommand): Promise<CancelEventResult> {
    const event = await this.repo.findOneById(command.eventId);
    if (!event) return Err(new EventNotFoundError());
    if (!event.isOrganizer(command.actorId)) return Err(new NotOrganizerError());

    const transition = event.cancel(command.reason ?? 'Cancelled by organizer', new Date());
    if (transition.isErr()) return Err(transition.unwrapErr());

    await this.repo.save(event);
    return Ok(event.id);
  }
}
