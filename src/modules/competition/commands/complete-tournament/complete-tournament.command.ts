import { Command, CommandProps } from '@libs/ddd';

export class CompleteTournamentCommand extends Command {
  readonly tournamentId: string;
  readonly actorId: string;

  constructor(props: CommandProps<CompleteTournamentCommand>) {
    super(props);
    this.tournamentId = props.tournamentId;
    this.actorId = props.actorId;
  }
}
