import { DomainEvent, DomainEventProps } from '@libs/ddd';

export class RegistrationCancelledDomainEvent extends DomainEvent {
  readonly eventId: string;
  readonly userId: string;

  constructor(props: DomainEventProps & { eventId: string; userId: string }) {
    super(props);
    this.eventId = props.eventId;
    this.userId = props.userId;
  }
}
