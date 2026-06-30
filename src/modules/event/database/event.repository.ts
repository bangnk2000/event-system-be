import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepositoryBase } from '@libs/db/typeorm-repository.base';
import { LOGGER_PORT, LoggerPort } from '@libs/ports/logger.port';
import { EventEntity } from '../domain/event.entity';
import { EventRepositoryPort } from '../application/ports/event.repository.port';
import { EventOrmEntity } from './event.persistence.model';
import { EventMapper } from './event.mapper';

@Injectable()
export class EventRepository
  extends TypeOrmRepositoryBase<EventEntity, EventOrmEntity>
  implements EventRepositoryPort
{
  protected readonly entityClass = EventOrmEntity;

  constructor(
    dataSource: DataSource,
    mapper: EventMapper,
    @Inject(LOGGER_PORT) logger: LoggerPort,
  ) {
    super(dataSource, mapper, logger);
  }
}
