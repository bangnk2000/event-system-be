import { Command, CommandProps } from '@libs/ddd';

export class AddBudgetItemCommand extends Command {
  readonly budgetId: string;
  readonly actorId: string;
  readonly name: string;
  readonly category: string;
  readonly plannedAmount: number;

  constructor(props: CommandProps<AddBudgetItemCommand>) {
    super(props);
    this.budgetId = props.budgetId;
    this.actorId = props.actorId;
    this.name = props.name;
    this.category = props.category;
    this.plannedAmount = props.plannedAmount;
  }
}
