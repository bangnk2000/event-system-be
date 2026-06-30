import { ExceptionBase } from '@libs/exceptions';

/**
 * Business-rule violations for the Event context. Used as VALUES returned via Result<T, E>
 * (never thrown). Controllers match() them and map to an HTTP status.
 */
export class InvalidEventScheduleError extends ExceptionBase {
  readonly code = 'EVENT.INVALID_SCHEDULE';

  constructor(message = 'Registration deadline must be on or before the event start time') {
    super(message);
  }
}

export class EventNotFoundError extends ExceptionBase {
  readonly code = 'EVENT.NOT_FOUND';

  constructor() {
    super('Event not found');
  }
}

export class NotOrganizerError extends ExceptionBase {
  readonly code = 'EVENT.NOT_ORGANIZER';

  constructor() {
    super('Only an organizing committee member can perform this action');
  }
}

export class InvalidEventStateError extends ExceptionBase {
  readonly code = 'EVENT.INVALID_STATE';

  constructor(action: string, currentState: string) {
    super(`Cannot ${action} an event in state ${currentState}`);
  }
}
