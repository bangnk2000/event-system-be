import { Command, CommandProps } from '@libs/ddd';

export class CreateBudgetCommand extends Command {
  readonly eventId: string;
  readonly actorId: string;
  readonly currency?: string;

  constructor(props: CommandProps<CreateBudgetCommand>) {
    super(props);
    this.eventId = props.eventId;
    this.actorId = props.actorId;
    this.currency = props.currency;
  }
}
