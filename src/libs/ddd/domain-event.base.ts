export interface DomainEventProps {
  readonly aggregateId: string;
}

/**
 * A record that something happened in the domain (past tense, immutable). Carries the aggregateId
 * and only the data subscribers need. The outbox serializes it by `constructor.name` + JSON props.
 */
export abstract class DomainEvent {
  public readonly aggregateId: string;

  constructor(props: DomainEventProps) {
    this.aggregateId = props.aggregateId;
  }
}
