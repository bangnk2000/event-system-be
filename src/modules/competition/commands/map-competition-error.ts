import {
  ArgumentInvalidException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@libs/exceptions';
import {
  CompetitionEventNotFoundError,
  CompetitorNotFoundError,
  DuplicateCompetitorError,
  InvalidRegistrationError,
  InvalidScoreError,
  InvalidSeedingError,
  InvalidTournamentStateError,
  KnockoutNotReadyError,
  MatchNotFoundError,
  MatchNotPlayableError,
  NotEventOrganizerError,
  TournamentNotFoundError,
} from '../domain/competition.errors';

export function throwCompetitionHttpError(error: Error): never {
  if (error instanceof CompetitionEventNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof TournamentNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof MatchNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof CompetitorNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof NotEventOrganizerError) throw new ForbiddenException(error.message);
  if (error instanceof DuplicateCompetitorError) throw new ConflictException(error.message);
  if (error instanceof InvalidTournamentStateError) throw new ConflictException(error.message);
  if (error instanceof MatchNotPlayableError) throw new ConflictException(error.message);
  if (error instanceof KnockoutNotReadyError) throw new ConflictException(error.message);
  if (error instanceof InvalidSeedingError) throw new ArgumentInvalidException(error.message);
  if (error instanceof InvalidScoreError) throw new ArgumentInvalidException(error.message);
  if (error instanceof InvalidRegistrationError) throw new ArgumentInvalidException(error.message);
  throw error;
}
