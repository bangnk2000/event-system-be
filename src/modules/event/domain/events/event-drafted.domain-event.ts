import { DomainEvent, DomainEventProps } from '@libs/ddd';

export class EventDraftedDomainEvent extends DomainEvent {
  readonly creatorId: string;
  readonly title: string;

  constructor(props: DomainEventProps & { creatorId: string; title: string }) {
    super(props);
    this.creatorId = props.creatorId;
    this.title = props.title;
  }
}
