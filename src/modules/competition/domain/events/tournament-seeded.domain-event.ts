import { DomainEvent, DomainEventProps } from '@libs/ddd';
import { TournamentFormat } from '../competition.types';

export class TournamentSeededDomainEvent extends DomainEvent {
  readonly eventId: string;
  readonly format: TournamentFormat;

  constructor(props: DomainEventProps & { eventId: string; format: TournamentFormat }) {
    super(props);
    this.eventId = props.eventId;
    this.format = props.format;
  }
}
