import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';

/**
 * The consistency boundary and the only object loaded/saved by a repository.
 * It collects domain events; the repository persists them to the outbox INSIDE the write
 * transaction (see libs/db/typeorm-repository.base.ts), then calls clearEvents().
 *
 * Kept framework-free on purpose — no EventEmitter import here, so the domain graph stays pure.
 */
export abstract class AggregateRoot<EntityProps> extends Entity<EntityProps> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): readonly DomainEvent[] {
    return this._domainEvents;
  }

  protected addEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
