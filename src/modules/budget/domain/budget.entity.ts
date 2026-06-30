import { Err, Ok, Result } from 'oxide.ts';
import { AggregateRoot } from '@libs/ddd';
import { BudgetCreatedDomainEvent } from './events/budget-created.domain-event';
import { BudgetItemAddedDomainEvent } from './events/budget-item-added.domain-event';
import { ActualRecordedDomainEvent } from './events/actual-recorded.domain-event';
import { BudgetFinalizedDomainEvent } from './events/budget-finalized.domain-event';
import { BudgetFinalizedError, BudgetItemNotFoundError } from './budget.errors';
import { BudgetItem } from './budget-item';
import { Money } from './value-objects/money.value-object';
import { BudgetProps, BudgetStatus } from './budget.types';

/**
 * Budget aggregate (one per event). Holds line items with planned vs actual amounts + invoices.
 * Edits are allowed only while DRAFT; finalize() = quyết toán (locks the budget).
 */
export class BudgetEntity extends AggregateRoot<BudgetProps> {
  static create(
    eventId: string,
    ownerId: string,
    currency: string,
    id: string,
    now: Date,
  ): BudgetEntity {
    const budget = new BudgetEntity({
      id,
      createdAt: now,
      updatedAt: now,
      props: { eventId, ownerId, currency, status: BudgetStatus.DRAFT, items: [] },
    });
    budget.addEvent(new BudgetCreatedDomainEvent({ aggregateId: id, eventId }));
    return budget;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get currency(): string {
    return this.props.currency;
  }

  get status(): BudgetStatus {
    return this.props.status;
  }

  get items(): readonly BudgetItem[] {
    return this.props.items;
  }

  isOwner(userId: string): boolean {
    return this.props.ownerId === userId;
  }

  totalPlanned(): number {
    return this.props.items.reduce((sum, item) => sum + item.planned.amount, 0);
  }

  totalActual(): number {
    return this.props.items.reduce((sum, item) => sum + item.actual.amount, 0);
  }

  addItem(
    itemId: string,
    name: string,
    category: string,
    planned: Money,
    now: Date,
  ): Result<void, BudgetFinalizedError> {
    if (this.props.status === BudgetStatus.FINALIZED) {
      return Err(new BudgetFinalizedError('add an item to'));
    }
    this.props.items.push(
      new BudgetItem(itemId, name, category, planned, Money.zero(this.props.currency), null),
    );
    this.setUpdatedAt(now);
    this.addEvent(new BudgetItemAddedDomainEvent({ aggregateId: this.id, itemId }));
    return Ok(undefined);
  }

  recordActual(
    itemId: string,
    actual: Money,
    invoiceUrl: string | null,
    now: Date,
  ): Result<void, BudgetFinalizedError | BudgetItemNotFoundError> {
    if (this.props.status === BudgetStatus.FINALIZED) {
      return Err(new BudgetFinalizedError('record actuals on'));
    }
    const index = this.props.items.findIndex((item) => item.itemId === itemId);
    if (index < 0) return Err(new BudgetItemNotFoundError());

    this.props.items[index] = this.props.items[index].withActual(actual, invoiceUrl);
    this.setUpdatedAt(now);
    this.addEvent(new ActualRecordedDomainEvent({ aggregateId: this.id, itemId }));
    return Ok(undefined);
  }

  finalize(now: Date): Result<void, BudgetFinalizedError> {
    if (this.props.status === BudgetStatus.FINALIZED) {
      return Err(new BudgetFinalizedError('finalize'));
    }
    this.props.status = BudgetStatus.FINALIZED;
    this.setUpdatedAt(now);
    this.addEvent(new BudgetFinalizedDomainEvent({ aggregateId: this.id, eventId: this.props.eventId }));
    return Ok(undefined);
  }

  public validate(): void {
    this.guardAgainstEmpty(this.props.eventId, 'eventId');
    this.guardAgainstEmpty(this.props.ownerId, 'ownerId');
    this.guardAgainstEmpty(this.props.currency, 'currency');
  }
}
