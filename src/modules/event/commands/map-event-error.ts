import {
  ArgumentInvalidException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@libs/exceptions';
import {
  EventNotFoundError,
  InvalidEventScheduleError,
  InvalidEventStateError,
  NotOrganizerError,
} from '../domain/event.errors';

/** Maps a returned Event domain error to the thrown libs/exception the global filter renders. */
export function throwEventHttpError(error: Error): never {
  if (error instanceof EventNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof NotOrganizerError) throw new ForbiddenException(error.message);
  if (error instanceof InvalidEventStateError) throw new ConflictException(error.message);
  if (error instanceof InvalidEventScheduleError) throw new ArgumentInvalidException(error.message);
  throw error; // unknown -> global filter -> 500
}
