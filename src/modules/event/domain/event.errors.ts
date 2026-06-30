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
