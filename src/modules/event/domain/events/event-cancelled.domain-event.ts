import { DomainEvent, DomainEventProps } from '@libs/ddd';

export class EventCancelledDomainEvent extends DomainEvent {
  readonly reason: string;

  constructor(props: DomainEventProps & { reason: string }) {
    super(props);
    this.reason = props.reason;
  }
}
