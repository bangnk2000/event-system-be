import { DomainEvent, DomainEventProps } from '@libs/ddd';

export class SurveyCreatedDomainEvent extends DomainEvent {
  readonly eventId: string;

  constructor(props: DomainEventProps & { eventId: string }) {
    super(props);
    this.eventId = props.eventId;
  }
}
