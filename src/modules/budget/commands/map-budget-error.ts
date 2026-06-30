import { ConflictException, ForbiddenException, NotFoundException } from '@libs/exceptions';
import {
  BudgetAlreadyExistsError,
  BudgetEventNotFoundError,
  BudgetFinalizedError,
  BudgetItemNotFoundError,
  BudgetNotFoundError,
  NotBudgetOwnerError,
  NotEventOrganizerError,
} from '../domain/budget.errors';

export function throwBudgetHttpError(error: Error): never {
  if (error instanceof BudgetEventNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof BudgetNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof BudgetItemNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof NotEventOrganizerError) throw new ForbiddenException(error.message);
  if (error instanceof NotBudgetOwnerError) throw new ForbiddenException(error.message);
  if (error instanceof BudgetAlreadyExistsError) throw new ConflictException(error.message);
  if (error instanceof BudgetFinalizedError) throw new ConflictException(error.message);
  throw error;
}
