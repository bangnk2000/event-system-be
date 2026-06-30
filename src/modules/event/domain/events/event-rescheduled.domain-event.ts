import { DomainEvent, DomainEventProps } from '@libs/ddd';

export class EventRescheduledDomainEvent extends DomainEvent {
  readonly startAt: Date;
  readonly endAt: Date;

  constructor(props: DomainEventProps & { startAt: Date; endAt: Date }) {
    super(props);
    this.startAt = props.startAt;
    this.endAt = props.endAt;
  }
}
