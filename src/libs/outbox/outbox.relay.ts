import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, IsNull } from 'typeorm';
import { LOGGER_PORT, LoggerPort } from '@libs/ports/logger.port';
import { OutboxMessageOrmEntity } from './outbox.entity';

/**
 * Polls the outbox and relays unprocessed events onto the in-process EventEmitter (by event name).
 * Domain-event handlers in each module subscribe and may issue follow-on commands
 * (Command -> Event -> Command). External adapters (ChatWork/Calendar/Drive) plug in here later.
 */
@Injectable()
export class OutboxRelay {
  private running = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    @Inject(LOGGER_PORT) private readonly logger: LoggerPort,
  ) {}

  @Interval(5000)
  async relay(): Promise<void> {
    if (this.running) return; // avoid overlapping ticks
    this.running = true;
    try {
      const repo = this.dataSource.getRepository(OutboxMessageOrmEntity);
      const pending = await repo.find({
        where: { processedAt: IsNull() },
        order: { createdAt: 'ASC' },
        take: 50,
      });

      for (const msg of pending) {
        this.logger.debug(`Relaying ${msg.eventName} for ${msg.aggregateId}`);
        this.eventEmitter.emit(msg.eventName, msg.payload);
        msg.processedAt = new Date();
        await repo.save(msg);
      }
    } catch (err) {
      this.logger.error('Outbox relay failed', err);
    } finally {
      this.running = false;
    }
  }
}
