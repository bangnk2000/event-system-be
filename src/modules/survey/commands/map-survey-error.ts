import {
  ArgumentInvalidException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@libs/exceptions';
import {
  AlreadyRespondedError,
  InvalidAnswerError,
  NotEligibleError,
  NotEventOrganizerError,
  SurveyEventNotFoundError,
  SurveyInvalidStateError,
  SurveyNoQuestionsError,
  SurveyNotFoundError,
  SurveyNotOpenError,
} from '../domain/survey.errors';

export function throwSurveyHttpError(error: Error): never {
  if (error instanceof SurveyEventNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof SurveyNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof NotEventOrganizerError) throw new ForbiddenException(error.message);
  if (error instanceof NotEligibleError) throw new ForbiddenException(error.message);
  if (error instanceof SurveyInvalidStateError) throw new ConflictException(error.message);
  if (error instanceof SurveyNoQuestionsError) throw new ConflictException(error.message);
  if (error instanceof SurveyNotOpenError) throw new ConflictException(error.message);
  if (error instanceof AlreadyRespondedError) throw new ConflictException(error.message);
  if (error instanceof InvalidAnswerError) throw new ArgumentInvalidException(error.message);
  throw error;
}
