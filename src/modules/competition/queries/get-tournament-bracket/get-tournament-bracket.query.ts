import { QueryBase } from '@libs/ddd';

export class GetTournamentBracketQuery extends QueryBase {
  readonly tournamentId: string;

  constructor(props: { tournamentId: string }) {
    super();
    this.tournamentId = props.tournamentId;
  }
}
