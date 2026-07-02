import { Command, CommandProps } from '@libs/ddd';

export class RemoveCompetitorCommand extends Command {
  readonly tournamentId: string;
  readonly actorId: string;
  readonly competitorId: string;

  constructor(props: CommandProps<RemoveCompetitorCommand>) {
    super(props);
    this.tournamentId = props.tournamentId;
    this.actorId = props.actorId;
    this.competitorId = props.competitorId;
  }
}
