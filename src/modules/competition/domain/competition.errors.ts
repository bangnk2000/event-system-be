import { ExceptionBase } from '@libs/exceptions';
import { TournamentStatus } from './competition.types';

export class CompetitionEventNotFoundError extends ExceptionBase {
  readonly code = 'COMPETITION.EVENT_NOT_FOUND';
  constructor() {
    super('Event not found for this tournament');
  }
}

export class NotEventOrganizerError extends ExceptionBase {
  readonly code = 'COMPETITION.NOT_EVENT_ORGANIZER';
  constructor() {
    super('Only an organizer of the event can manage its tournaments');
  }
}

export class TournamentNotFoundError extends ExceptionBase {
  readonly code = 'COMPETITION.NOT_FOUND';
  constructor() {
    super('Tournament not found');
  }
}

export class InvalidTournamentStateError extends ExceptionBase {
  readonly code = 'COMPETITION.INVALID_STATE';
  constructor(action: string, current: TournamentStatus) {
    super(`Cannot ${action} a tournament in ${current} state`);
  }
}

export class InvalidSeedingError extends ExceptionBase {
  readonly code = 'COMPETITION.INVALID_SEED';
  constructor(reason: string) {
    super(`Cannot seed tournament: ${reason}`);
  }
}

export class InvalidScoreError extends ExceptionBase {
  readonly code = 'COMPETITION.INVALID_SCORE';
  constructor(reason: string) {
    super(`Invalid score: ${reason}`);
  }
}

export class MatchNotFoundError extends ExceptionBase {
  readonly code = 'COMPETITION.MATCH_NOT_FOUND';
  constructor() {
    super('Match not found in this tournament');
  }
}

export class MatchNotPlayableError extends ExceptionBase {
  readonly code = 'COMPETITION.MATCH_NOT_PLAYABLE';
  constructor() {
    super('Match is not ready to be played (missing an opponent or already played)');
  }
}

export class CompetitorNotFoundError extends ExceptionBase {
  readonly code = 'COMPETITION.COMPETITOR_NOT_FOUND';
  constructor() {
    super('Competitor not found in this tournament');
  }
}

export class DuplicateCompetitorError extends ExceptionBase {
  readonly code = 'COMPETITION.DUPLICATE_COMPETITOR';
  constructor() {
    super('This registration is already a competitor in the tournament');
  }
}

export class InvalidRegistrationError extends ExceptionBase {
  readonly code = 'COMPETITION.INVALID_REGISTRATION';
  constructor() {
    super('Registration is not a valid participant of this event');
  }
}

export class KnockoutNotReadyError extends ExceptionBase {
  readonly code = 'COMPETITION.KNOCKOUT_NOT_READY';
  constructor(reason: string) {
    super(`Cannot advance to knockout: ${reason}`);
  }
}
