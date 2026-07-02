import { ExceptionBase } from '@libs/exceptions';

export class SurveyEventNotFoundError extends ExceptionBase {
  readonly code = 'SURVEY.EVENT_NOT_FOUND';
  constructor() {
    super('Event not found for this survey');
  }
}

export class NotEventOrganizerError extends ExceptionBase {
  readonly code = 'SURVEY.NOT_EVENT_ORGANIZER';
  constructor() {
    super('Only an organizer of the event can manage its surveys');
  }
}

export class SurveyNotFoundError extends ExceptionBase {
  readonly code = 'SURVEY.NOT_FOUND';
  constructor() {
    super('Survey not found');
  }
}

export class SurveyInvalidStateError extends ExceptionBase {
  readonly code = 'SURVEY.INVALID_STATE';
  constructor(action: string, current: string) {
    super(`Cannot ${action} a survey in status ${current}`);
  }
}

export class SurveyNoQuestionsError extends ExceptionBase {
  readonly code = 'SURVEY.NO_QUESTIONS';
  constructor() {
    super('A survey must have at least one question before it can be opened');
  }
}

export class SurveyNotOpenError extends ExceptionBase {
  readonly code = 'SURVEY.NOT_OPEN';
  constructor() {
    super('This survey is not open for responses');
  }
}

export class NotEligibleError extends ExceptionBase {
  readonly code = 'SURVEY.NOT_ELIGIBLE';
  constructor() {
    super('You are not eligible to respond to this survey');
  }
}

export class AlreadyRespondedError extends ExceptionBase {
  readonly code = 'SURVEY.ALREADY_RESPONDED';
  constructor() {
    super('You have already responded to this survey');
  }
}

export class InvalidAnswerError extends ExceptionBase {
  readonly code = 'SURVEY.INVALID_ANSWER';
  constructor(message: string) {
    super(message);
  }
}
