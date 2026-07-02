import { DomainEvent, DomainEventProps } from '@libs/ddd';

export class TournamentCompletedDomainEvent extends DomainEvent {
  readonly eventId: string;
  readonly championCompetitorId: string | null;

  constructor(props: DomainEventProps & { eventId: string; championCompetitorId: string | null }) {
    super(props);
    this.eventId = props.eventId;
    this.championCompetitorId = props.championCompetitorId;
  }
}
