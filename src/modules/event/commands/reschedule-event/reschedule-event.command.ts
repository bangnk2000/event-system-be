import { Command, CommandProps } from '@libs/ddd';

export class RescheduleEventCommand extends Command {
  readonly eventId: string;
  readonly actorId: string;
  readonly startAt: Date;
  readonly endAt: Date;

  constructor(props: CommandProps<RescheduleEventCommand>) {
    super(props);
    this.eventId = props.eventId;
    this.actorId = props.actorId;
    this.startAt = props.startAt;
    this.endAt = props.endAt;
  }
}
