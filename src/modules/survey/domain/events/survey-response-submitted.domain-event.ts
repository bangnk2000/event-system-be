import { DomainEvent, DomainEventProps } from '@libs/ddd';

export class SurveyResponseSubmittedDomainEvent extends DomainEvent {
  readonly surveyId: string;

  constructor(props: DomainEventProps & { surveyId: string }) {
    super(props);
    this.surveyId = props.surveyId;
  }
}
