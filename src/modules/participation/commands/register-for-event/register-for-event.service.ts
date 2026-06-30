import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOpenForRegistrationQuery,
  IsEventOpenForRegistrationResult,
} from '@libs/contracts/event/is-event-open-for-registration.query';
import { RegisterForEventCommand } from './register-for-event.command';
import { RegistrationEntity } from '../../domain/registration.entity';
import {
  AlreadyRegisteredError,
  EventNotOpenForRegistrationError,
  RegistrationEventNotFoundError,
} from '../../domain/registration.errors';
import {
  REGISTRATION_REPOSITORY,
  RegistrationRepositoryPort,
} from '../../application/ports/registration.repository.port';

export type RegisterForEventResult = Result<
  string,
  RegistrationEventNotFoundError | EventNotOpenForRegistrationError | AlreadyRegisteredError
>;

@CommandHandler(RegisterForEventCommand)
export class RegisterForEventService
  implements ICommandHandler<RegisterForEventCommand, RegisterForEventResult>
{
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly repo: RegistrationRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: RegisterForEventCommand): Promise<RegisterForEventResult> {
    // Cross-context check — ask the `event` context whether registration is open (no module import).
    const event: IsEventOpenForRegistrationResult = await this.queryBus.execute(
      new IsEventOpenForRegistrationQuery({ eventId: command.eventId }),
    );
    if (!event.eventExists) return Err(new RegistrationEventNotFoundError());
    if (!event.isOpen) return Err(new EventNotOpenForRegistrationError());

    const existing = await this.repo.findActiveByEventAndUser(command.eventId, command.userId);
    if (existing) return Err(new AlreadyRegisteredError());

    const registration = RegistrationEntity.register(
      {
        eventId: command.eventId,
        mode: command.mode,
        userId: command.userId,
        teamName: command.teamName ?? null,
        memberIds: command.memberIds ?? [],
      },
      this.repo.nextId(),
      new Date(),
    );

    await this.repo.insert(registration);
    return Ok(registration.id);
  }
}
