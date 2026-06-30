import { DomainEvent, DomainEventProps } from '@libs/ddd';

export class ActualRecordedDomainEvent extends DomainEvent {
  readonly itemId: string;

  constructor(props: DomainEventProps & { itemId: string }) {
    super(props);
    this.itemId = props.itemId;
  }
}
