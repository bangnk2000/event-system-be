import { DomainEvent, DomainEventProps } from '@libs/ddd';
import { ParticipationMode } from '../registration.types';

export class ParticipantRegisteredDomainEvent extends DomainEvent {
  readonly eventId: string;
  readonly userId: string;
  readonly mode: ParticipationMode;

  constructor(props: DomainEventProps & { eventId: string; userId: string; mode: ParticipationMode }) {
    super(props);
    this.eventId = props.eventId;
    this.userId = props.userId;
    this.mode = props.mode;
  }
}
