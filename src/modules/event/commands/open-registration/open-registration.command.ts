import { Command, CommandProps } from '@libs/ddd';

export class OpenRegistrationCommand extends Command {
  readonly eventId: string;
  readonly actorId: string;

  constructor(props: CommandProps<OpenRegistrationCommand>) {
    super(props);
    this.eventId = props.eventId;
    this.actorId = props.actorId;
  }
}
