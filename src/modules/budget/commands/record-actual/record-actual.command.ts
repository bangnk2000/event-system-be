import { Command, CommandProps } from '@libs/ddd';

export class RecordActualCommand extends Command {
  readonly budgetId: string;
  readonly itemId: string;
  readonly actorId: string;
  readonly actualAmount: number;
  readonly invoiceUrl?: string;

  constructor(props: CommandProps<RecordActualCommand>) {
    super(props);
    this.budgetId = props.budgetId;
    this.itemId = props.itemId;
    this.actorId = props.actorId;
    this.actualAmount = props.actualAmount;
    this.invoiceUrl = props.invoiceUrl;
  }
}
