import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepositoryBase } from '@libs/db/typeorm-repository.base';
import { LOGGER_PORT, LoggerPort } from '@libs/ports/logger.port';
import { SurveyEntity } from '../domain/survey.entity';
import { SurveyRepositoryPort } from '../application/ports/survey.repository.port';
import { SurveyOrmEntity } from './survey.persistence.model';
import { SurveyMapper } from './survey.mapper';

@Injectable()
export class SurveyRepository
  extends TypeOrmRepositoryBase<SurveyEntity, SurveyOrmEntity>
  implements SurveyRepositoryPort
{
  protected readonly entityClass = SurveyOrmEntity;

  constructor(
    dataSource: DataSource,
    mapper: SurveyMapper,
    @Inject(LOGGER_PORT) logger: LoggerPort,
  ) {
    super(dataSource, mapper, logger);
  }

  async findByEventId(eventId: string): Promise<SurveyEntity[]> {
    const rows = await this.dataSource
      .getRepository(SurveyOrmEntity)
      .find({ where: { eventId }, order: { createdAt: 'ASC' } });
    return rows.map((row) => (this.mapper as SurveyMapper).toDomain(row));
  }
}
