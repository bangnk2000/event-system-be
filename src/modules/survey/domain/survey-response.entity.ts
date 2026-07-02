import { AggregateRoot } from '@libs/ddd';
import { SurveyResponseSubmittedDomainEvent } from './events/survey-response-submitted.domain-event';
import { SurveyAnswer } from './survey-answer';

export interface SurveyResponseProps {
  surveyId: string;
  /** HMAC(secret, surveyId + userId) — blocks duplicates WITHOUT storing the respondent's identity. */
  respondentToken: string;
  answers: SurveyAnswer[];
  submittedAt: Date;
}

/**
 * A single, anonymous-to-organizers survey submission. Separate aggregate from Survey (high volume,
 * independent lifecycle). Answers were already validated against the survey's questions by the
 * command handler (see SurveyEntity.buildAnswers).
 */
export class SurveyResponseEntity extends AggregateRoot<SurveyResponseProps> {
  static submit(
    surveyId: string,
    respondentToken: string,
    answers: SurveyAnswer[],
    id: string,
    now: Date,
  ): SurveyResponseEntity {
    const response = new SurveyResponseEntity({
      id,
      createdAt: now,
      updatedAt: now,
      props: { surveyId, respondentToken, answers, submittedAt: now },
    });
    response.addEvent(new SurveyResponseSubmittedDomainEvent({ aggregateId: id, surveyId }));
    return response;
  }

  get surveyId(): string {
    return this.props.surveyId;
  }

  get respondentToken(): string {
    return this.props.respondentToken;
  }

  get answers(): readonly SurveyAnswer[] {
    return this.props.answers;
  }

  get submittedAt(): Date {
    return this.props.submittedAt;
  }

  public validate(): void {
    this.guardAgainstEmpty(this.props.surveyId, 'surveyId');
    this.guardAgainstEmpty(this.props.respondentToken, 'respondentToken');
  }
}
