import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import { CheckInCommand } from './check-in.command';
import {
  REGISTRATION_REPOSITORY,
  RegistrationRepositoryPort,
} from '../../application/ports/registration.repository.port';
import {
  AlreadyCheckedInError,
  RegistrationNotActiveError,
  RegistrationNotFoundError,
} from '../../domain/registration.errors';

export type CheckInResult = Result<
  string,
  RegistrationNotFoundError | RegistrationNotActiveError | AlreadyCheckedInError
>;

/**
 * Check-in is performed by the organizer scanning the QR (or the participant self-checking in),
 * so identity is not enforced here yet — only authentication is required at the controller.
 */
@CommandHandler(CheckInCommand)
export class CheckInService implements ICommandHandler<CheckInCommand, CheckInResult> {
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly repo: RegistrationRepositoryPort,
  ) {}

  async execute(command: CheckInCommand): Promise<CheckInResult> {
    const registration = await this.repo.findOneById(command.registrationId);
    if (!registration) return Err(new RegistrationNotFoundError());

    const transition = registration.checkIn(new Date());
    if (transition.isErr()) return Err(transition.unwrapErr());

    await this.repo.save(registration);
    return Ok(registration.id);
  }
}
