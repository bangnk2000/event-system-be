import { Err, Ok, Result } from 'oxide.ts';
import { AggregateRoot } from '@libs/ddd';
import { SurveyCreatedDomainEvent } from './events/survey-created.domain-event';
import { SurveyOpenedDomainEvent } from './events/survey-opened.domain-event';
import { SurveyClosedDomainEvent } from './events/survey-closed.domain-event';
import {
  InvalidAnswerError,
  SurveyInvalidStateError,
  SurveyNoQuestionsError,
} from './survey.errors';
import { SurveyQuestion } from './survey-question';
import { SurveyAnswer } from './survey-answer';
import { MultilingualText } from './value-objects/multilingual-text.value-object';
import { AnswerInput, RespondentScope, SurveyProps, SurveyStatus } from './survey.types';

export interface CreateSurveyProps {
  eventId: string;
  ownerId: string;
  title: MultilingualText;
  description: MultilingualText | null;
  respondentScope: RespondentScope;
  questions: SurveyQuestion[];
}

/**
 * Survey aggregate (one or more per event). Holds the questionnaire and its lifecycle.
 * Questions are editable only while DRAFT; open() starts collecting responses, close() ends it.
 * Responses live in a SEPARATE aggregate (SurveyResponse) — kept anonymous to organizers.
 */
export class SurveyEntity extends AggregateRoot<SurveyProps> {
  static create(props: CreateSurveyProps, id: string, now: Date): SurveyEntity {
    const survey = new SurveyEntity({
      id,
      createdAt: now,
      updatedAt: now,
      props: {
        eventId: props.eventId,
        ownerId: props.ownerId,
        title: props.title,
        description: props.description,
        status: SurveyStatus.DRAFT,
        respondentScope: props.respondentScope,
        questions: props.questions,
      },
    });
    survey.addEvent(new SurveyCreatedDomainEvent({ aggregateId: id, eventId: props.eventId }));
    return survey;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get status(): SurveyStatus {
    return this.props.status;
  }

  get respondentScope(): RespondentScope {
    return this.props.respondentScope;
  }

  get questions(): readonly SurveyQuestion[] {
    return this.props.questions;
  }

  isOpen(): boolean {
    return this.props.status === SurveyStatus.OPEN;
  }

  open(now: Date): Result<void, SurveyInvalidStateError | SurveyNoQuestionsError> {
    if (this.props.status !== SurveyStatus.DRAFT) {
      return Err(new SurveyInvalidStateError('open', this.props.status));
    }
    if (this.props.questions.length === 0) {
      return Err(new SurveyNoQuestionsError());
    }
    this.props.status = SurveyStatus.OPEN;
    this.setUpdatedAt(now);
    this.addEvent(new SurveyOpenedDomainEvent({ aggregateId: this.id, eventId: this.props.eventId }));
    return Ok(undefined);
  }

  close(now: Date): Result<void, SurveyInvalidStateError> {
    if (this.props.status !== SurveyStatus.OPEN) {
      return Err(new SurveyInvalidStateError('close', this.props.status));
    }
    this.props.status = SurveyStatus.CLOSED;
    this.setUpdatedAt(now);
    this.addEvent(new SurveyClosedDomainEvent({ aggregateId: this.id, eventId: this.props.eventId }));
    return Ok(undefined);
  }

  /**
   * Validate a submission's raw answers against this survey's questions (INV-R1/R2):
   * unknown question ids are rejected; each required question must be answered; each value must
   * match its question type. Returns the normalized answers to store on a SurveyResponse.
   */
  buildAnswers(inputs: AnswerInput[]): Result<SurveyAnswer[], InvalidAnswerError> {
    for (const input of inputs) {
      if (!this.props.questions.some((q) => q.questionId === input.questionId)) {
        return Err(new InvalidAnswerError(`Unknown question ${input.questionId}`));
      }
    }
    const byId = new Map(inputs.map((input) => [input.questionId, input]));
    const answers: SurveyAnswer[] = [];
    for (const question of this.props.questions) {
      const result = question.buildAnswer(byId.get(question.questionId));
      if (result.isErr()) return Err(result.unwrapErr());
      const answer = result.unwrap();
      if (answer) answers.push(answer);
    }
    return Ok(answers);
  }

  public validate(): void {
    this.guardAgainstEmpty(this.props.eventId, 'eventId');
    this.guardAgainstEmpty(this.props.ownerId, 'ownerId');
  }
}
