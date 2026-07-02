import { DomainEvent, DomainEventProps } from '@libs/ddd';

export class MatchResultRecordedDomainEvent extends DomainEvent {
  readonly matchId: string;
  readonly winner: string;

  constructor(props: DomainEventProps & { matchId: string; winner: string }) {
    super(props);
    this.matchId = props.matchId;
    this.winner = props.winner;
  }
}
