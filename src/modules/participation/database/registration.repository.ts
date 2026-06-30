import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepositoryBase } from '@libs/db/typeorm-repository.base';
import { LOGGER_PORT, LoggerPort } from '@libs/ports/logger.port';
import { RegistrationEntity } from '../domain/registration.entity';
import { RegistrationStatus } from '../domain/registration.types';
import { RegistrationRepositoryPort } from '../application/ports/registration.repository.port';
import { RegistrationOrmEntity } from './registration.persistence.model';
import { RegistrationMapper } from './registration.mapper';

@Injectable()
export class RegistrationRepository
  extends TypeOrmRepositoryBase<RegistrationEntity, RegistrationOrmEntity>
  implements RegistrationRepositoryPort
{
  protected readonly entityClass = RegistrationOrmEntity;

  constructor(
    dataSource: DataSource,
    mapper: RegistrationMapper,
    @Inject(LOGGER_PORT) logger: LoggerPort,
  ) {
    super(dataSource, mapper, logger);
  }

  async findActiveByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<RegistrationEntity | null> {
    const row = await this.dataSource.getRepository(RegistrationOrmEntity).findOne({
      where: { eventId, userId, status: RegistrationStatus.REGISTERED },
    });
    return row ? (this.mapper as RegistrationMapper).toDomain(row) : null;
  }
}
