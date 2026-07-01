import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepositoryBase } from '@libs/db/typeorm-repository.base';
import { LOGGER_PORT, LoggerPort } from '@libs/ports/logger.port';
import { NotificationPreferenceEntity } from '../domain/notification-preference.entity';
import { NotificationPreferenceRepositoryPort } from '../application/ports/notification-preference.repository.port';
import { NotificationPreferenceOrmEntity } from './notification-preference.persistence.model';
import { NotificationPreferenceMapper } from './notification-preference.mapper';

@Injectable()
export class NotificationPreferenceRepository
  extends TypeOrmRepositoryBase<NotificationPreferenceEntity, NotificationPreferenceOrmEntity>
  implements NotificationPreferenceRepositoryPort
{
  protected readonly entityClass = NotificationPreferenceOrmEntity;

  constructor(
    dataSource: DataSource,
    mapper: NotificationPreferenceMapper,
    @Inject(LOGGER_PORT) logger: LoggerPort,
  ) {
    super(dataSource, mapper, logger);
  }
}
