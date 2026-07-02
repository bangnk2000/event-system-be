import { Command, CommandProps } from '@libs/ddd';

export class SeedTournamentCommand extends Command {
  readonly tournamentId: string;
  readonly actorId: string;

  constructor(props: CommandProps<SeedTournamentCommand>) {
    super(props);
    this.tournamentId = props.tournamentId;
    this.actorId = props.actorId;
  }
}
