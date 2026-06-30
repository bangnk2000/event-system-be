import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import { PublishEventCommand } from './publish-event.command';
import {
  EVENT_REPOSITORY,
  EventRepositoryPort,
} from '../../application/ports/event.repository.port';
import {
  EventNotFoundError,
  InvalidEventStateError,
  NotOrganizerError,
} from '../../domain/event.errors';

export type PublishEventResult = Result<
  string,
  EventNotFoundError | NotOrganizerError | InvalidEventStateError
>;

@CommandHandler(PublishEventCommand)
export class PublishEventService
  implements ICommandHandler<PublishEventCommand, PublishEventResult>
{
  constructor(@Inject(EVENT_REPOSITORY) private readonly repo: EventRepositoryPort) {}

  async execute(command: PublishEventCommand): Promise<PublishEventResult> {
    const event = await this.repo.findOneById(command.eventId);
    if (!event) return Err(new EventNotFoundError());
    if (!event.isOrganizer(command.actorId)) return Err(new NotOrganizerError());

    const transition = event.publish(new Date());
    if (transition.isErr()) return Err(transition.unwrapErr());

    await this.repo.save(event);
    return Ok(event.id);
  }
}
