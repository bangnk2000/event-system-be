import { Command, CommandProps } from '@libs/ddd';

export class FinalizeBudgetCommand extends Command {
  readonly budgetId: string;
  readonly actorId: string;

  constructor(props: CommandProps<FinalizeBudgetCommand>) {
    super(props);
    this.budgetId = props.budgetId;
    this.actorId = props.actorId;
  }
}
