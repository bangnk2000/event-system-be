import { Money } from './value-objects/money.value-object';

/** A budget line item (internal to the Budget aggregate). Immutable — updates return a new instance. */
export class BudgetItem {
  constructor(
    readonly itemId: string,
    readonly name: string,
    readonly category: string,
    readonly planned: Money,
    readonly actual: Money,
    readonly invoiceUrl: string | null,
  ) {}

  withActual(actual: Money, invoiceUrl: string | null): BudgetItem {
    return new BudgetItem(this.itemId, this.name, this.category, this.planned, actual, invoiceUrl);
  }
}
