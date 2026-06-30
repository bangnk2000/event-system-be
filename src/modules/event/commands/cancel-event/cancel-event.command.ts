import { Command, CommandProps } from '@libs/ddd';

export class CancelEventCommand extends Command {
  readonly eventId: string;
  readonly actorId: string;
  readonly reason: string;

  constructor(props: CommandProps<CancelEventCommand>) {
    super(props);
    this.eventId = props.eventId;
    this.actorId = props.actorId;
    this.reason = props.reason;
  }
}
