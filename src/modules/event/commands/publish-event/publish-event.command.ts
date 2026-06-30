import { Command, CommandProps } from '@libs/ddd';

export class PublishEventCommand extends Command {
  readonly eventId: string;
  readonly actorId: string;

  constructor(props: CommandProps<PublishEventCommand>) {
    super(props);
    this.eventId = props.eventId;
    this.actorId = props.actorId;
  }
}
