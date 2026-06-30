import { Command, CommandProps } from '@libs/ddd';
import { EventType } from '../../domain/event.types';
import { RegistrationMode } from '../../domain/value-objects/registration-policy.value-object';

export class CreateEventCommand extends Command {
  readonly organizerId: string;
  readonly titleVi: string;
  readonly titleJa?: string;
  readonly descriptionVi?: string;
  readonly descriptionJa?: string;
  readonly type: EventType;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly locationKind?: 'ONLINE' | 'OFFLINE';
  readonly locationAddress?: string;
  readonly locationUrl?: string;
  readonly capacity?: number | null;
  readonly registrationMode: RegistrationMode;
  readonly registrationDeadline?: Date | null;

  constructor(props: CommandProps<CreateEventCommand>) {
    super(props);
    this.organizerId = props.organizerId;
    this.titleVi = props.titleVi;
    this.titleJa = props.titleJa;
    this.descriptionVi = props.descriptionVi;
    this.descriptionJa = props.descriptionJa;
    this.type = props.type;
    this.startAt = props.startAt;
    this.endAt = props.endAt;
    this.locationKind = props.locationKind;
    this.locationAddress = props.locationAddress;
    this.locationUrl = props.locationUrl;
    this.capacity = props.capacity;
    this.registrationMode = props.registrationMode;
    this.registrationDeadline = props.registrationDeadline;
  }
}
