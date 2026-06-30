import { ConflictException, ForbiddenException, NotFoundException } from '@libs/exceptions';
import {
  AlreadyCheckedInError,
  AlreadyRegisteredError,
  NotRegistrantError,
  RegistrationNotActiveError,
  RegistrationNotFoundError,
} from '../domain/registration.errors';

/** Maps a returned Registration domain error to the thrown libs/exception the global filter renders. */
export function throwRegistrationHttpError(error: Error): never {
  if (error instanceof RegistrationNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof NotRegistrantError) throw new ForbiddenException(error.message);
  if (error instanceof AlreadyRegisteredError) throw new ConflictException(error.message);
  if (error instanceof RegistrationNotActiveError) throw new ConflictException(error.message);
  if (error instanceof AlreadyCheckedInError) throw new ConflictException(error.message);
  throw error;
}
