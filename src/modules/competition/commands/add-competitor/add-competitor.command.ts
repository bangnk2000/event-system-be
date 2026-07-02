import { Command, CommandProps } from '@libs/ddd';

export class AddCompetitorCommand extends Command {
  readonly tournamentId: string;
  readonly actorId: string;
  readonly registrationId: string;

  constructor(props: CommandProps<AddCompetitorCommand>) {
    super(props);
    this.tournamentId = props.tournamentId;
    this.actorId = props.actorId;
    this.registrationId = props.registrationId;
  }
}
