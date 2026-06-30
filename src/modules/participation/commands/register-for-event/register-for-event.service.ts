import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import { RegisterForEventCommand } from './register-for-event.command';
import { RegistrationEntity } from '../../domain/registration.entity';
import { AlreadyRegisteredError } from '../../domain/registration.errors';
import {
  REGISTRATION_REPOSITORY,
  RegistrationRepositoryPort,
} from '../../application/ports/registration.repository.port';

export type RegisterForEventResult = Result<string, AlreadyRegisteredError>;

@CommandHandler(RegisterForEventCommand)
export class RegisterForEventService
  implements ICommandHandler<RegisterForEventCommand, RegisterForEventResult>
{
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly repo: RegistrationRepositoryPort,
  ) {}

  async execute(command: RegisterForEventCommand): Promise<RegisterForEventResult> {
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
