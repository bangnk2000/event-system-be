import { Command, CommandProps } from '@libs/ddd';

export class RecordMatchResultCommand extends Command {
  readonly tournamentId: string;
  readonly actorId: string;
  readonly matchId: string;
  readonly scoreA: number;
  readonly scoreB: number;
  readonly detail?: string;

  constructor(props: CommandProps<RecordMatchResultCommand>) {
    super(props);
    this.tournamentId = props.tournamentId;
    this.actorId = props.actorId;
    this.matchId = props.matchId;
    this.scoreA = props.scoreA;
    this.scoreB = props.scoreB;
    this.detail = props.detail;
  }
}
