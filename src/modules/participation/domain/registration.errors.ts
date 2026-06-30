import { ExceptionBase } from '@libs/exceptions';

export class RegistrationNotFoundError extends ExceptionBase {
  readonly code = 'REGISTRATION.NOT_FOUND';
  constructor() {
    super('Registration not found');
  }
}

export class AlreadyRegisteredError extends ExceptionBase {
  readonly code = 'REGISTRATION.ALREADY_REGISTERED';
  constructor() {
    super('User is already registered for this event');
  }
}

export class NotRegistrantError extends ExceptionBase {
  readonly code = 'REGISTRATION.NOT_REGISTRANT';
  constructor() {
    super('Only the registrant can perform this action');
  }
}

export class RegistrationNotActiveError extends ExceptionBase {
  readonly code = 'REGISTRATION.NOT_ACTIVE';
  constructor() {
    super('Registration is not active');
  }
}

export class AlreadyCheckedInError extends ExceptionBase {
  readonly code = 'REGISTRATION.ALREADY_CHECKED_IN';
  constructor() {
    super('Participant is already checked in');
  }
}
