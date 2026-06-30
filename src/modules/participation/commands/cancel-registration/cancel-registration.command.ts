import { Command, CommandProps } from '@libs/ddd';

export class CancelRegistrationCommand extends Command {
  readonly registrationId: string;
  readonly actorId: string;

  constructor(props: CommandProps<CancelRegistrationCommand>) {
    super(props);
    this.registrationId = props.registrationId;
    this.actorId = props.actorId;
  }
}
