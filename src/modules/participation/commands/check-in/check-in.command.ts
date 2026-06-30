import { Command, CommandProps } from '@libs/ddd';

export class CheckInCommand extends Command {
  readonly registrationId: string;
  readonly actorId: string;

  constructor(props: CommandProps<CheckInCommand>) {
    super(props);
    this.registrationId = props.registrationId;
    this.actorId = props.actorId;
  }
}
