import { Command, CommandProps } from '@libs/ddd';
import { TournamentFormat } from '../../domain/competition.types';

export class CreateTournamentCommand extends Command {
  readonly eventId: string;
  readonly actorId: string;
  readonly nameVi: string;
  readonly nameJa?: string;
  readonly format: TournamentFormat;
  readonly numGroups?: number;
  readonly advancePerGroup?: number;

  constructor(props: CommandProps<CreateTournamentCommand>) {
    super(props);
    this.eventId = props.eventId;
    this.actorId = props.actorId;
    this.nameVi = props.nameVi;
    this.nameJa = props.nameJa;
    this.format = props.format;
    this.numGroups = props.numGroups;
    this.advancePerGroup = props.advancePerGroup;
  }
}
