import { DomainEvent, DomainEventProps } from '@libs/ddd';

export class SurveyClosedDomainEvent extends DomainEvent {
  readonly eventId: string;

  constructor(props: DomainEventProps & { eventId: string }) {
    super(props);
    this.eventId = props.eventId;
  }
}
