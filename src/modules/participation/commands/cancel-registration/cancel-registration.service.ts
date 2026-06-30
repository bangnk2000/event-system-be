import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import { CancelRegistrationCommand } from './cancel-registration.command';
import {
  REGISTRATION_REPOSITORY,
  RegistrationRepositoryPort,
} from '../../application/ports/registration.repository.port';
import {
  NotRegistrantError,
  RegistrationNotActiveError,
  RegistrationNotFoundError,
} from '../../domain/registration.errors';

export type CancelRegistrationResult = Result<
  string,
  RegistrationNotFoundError | NotRegistrantError | RegistrationNotActiveError
>;

@CommandHandler(CancelRegistrationCommand)
export class CancelRegistrationService
  implements ICommandHandler<CancelRegistrationCommand, CancelRegistrationResult>
{
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly repo: RegistrationRepositoryPort,
  ) {}

  async execute(command: CancelRegistrationCommand): Promise<CancelRegistrationResult> {
    const registration = await this.repo.findOneById(command.registrationId);
    if (!registration) return Err(new RegistrationNotFoundError());
    if (registration.userId !== command.actorId) return Err(new NotRegistrantError());

    const transition = registration.cancel(new Date());
    if (transition.isErr()) return Err(transition.unwrapErr());

    await this.repo.save(registration);
    return Ok(registration.id);
  }
}
