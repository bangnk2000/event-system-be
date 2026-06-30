import { randomUUID } from 'node:crypto';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { AggregateRoot, Mapper, RepositoryPort } from '@libs/ddd';
import { LoggerPort } from '@libs/ports/logger.port';
import { OutboxMessageOrmEntity } from '@libs/outbox/outbox.entity';

/**
 * TypeORM variant of the spec's SqlRepositoryBase. The only place an aggregate root is loaded/saved.
 * Writes the aggregate row AND its domain events (to the outbox) inside ONE transaction, so events
 * are never relayed for a write that rolled back.
 */
export abstract class TypeOrmRepositoryBase<
  Aggregate extends AggregateRoot<unknown>,
  Persistence extends ObjectLiteral,
> implements RepositoryPort<Aggregate>
{
  protected abstract readonly entityClass: EntityTarget<Persistence>;

  protected constructor(
    protected readonly dataSource: DataSource,
    protected readonly mapper: Mapper<Aggregate, Persistence, unknown>,
    protected readonly logger: LoggerPort,
  ) {}

  insert(entity: Aggregate): Promise<void> {
    return this.writeInTransaction(entity);
  }

  save(entity: Aggregate): Promise<void> {
    return this.writeInTransaction(entity);
  }

  async findOneById(id: string): Promise<Aggregate | null> {
    const row = await this.dataSource
      .getRepository(this.entityClass)
      .findOne({ where: { id } as never });
    return row ? this.mapper.toDomain(row) : null;
  }

  async delete(entity: Aggregate): Promise<void> {
    await this.dataSource.getRepository(this.entityClass).delete(entity.id);
  }

  /** Infrastructure generates ids; the domain never does. */
  nextId(): string {
    return randomUUID();
  }

  private async writeInTransaction(entity: Aggregate): Promise<void> {
    const events = [...entity.domainEvents];

    await this.dataSource.transaction(async (manager) => {
      const record = this.mapper.toPersistence(entity);
      await manager.getRepository(this.entityClass).save(record);

      if (events.length > 0) {
        const outboxRepo = manager.getRepository(OutboxMessageOrmEntity);
        const rows = events.map((event) =>
          outboxRepo.create({
            id: randomUUID(),
            aggregateId: event.aggregateId,
            eventName: event.constructor.name,
            payload: { ...(event as object) } as Record<string, unknown>,
            createdAt: new Date(),
            processedAt: null,
          }),
        );
        await outboxRepo.save(rows);
      }
    });

    entity.clearEvents();
    this.logger.debug(
      `Persisted ${entity.constructor.name} ${entity.id} (+${events.length} event(s) to outbox)`,
    );
  }
}
