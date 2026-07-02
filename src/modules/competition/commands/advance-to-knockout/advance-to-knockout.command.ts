import { Command, CommandProps } from '@libs/ddd';

export class AdvanceToKnockoutCommand extends Command {
  readonly tournamentId: string;
  readonly actorId: string;

  constructor(props: CommandProps<AdvanceToKnockoutCommand>) {
    super(props);
    this.tournamentId = props.tournamentId;
    this.actorId = props.actorId;
  }
}
