import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepositoryBase } from '@libs/db/typeorm-repository.base';
import { LOGGER_PORT, LoggerPort } from '@libs/ports/logger.port';
import { SurveyResponseEntity } from '../domain/survey-response.entity';
import { SurveyResponseRepositoryPort } from '../application/ports/survey-response.repository.port';
import { SurveyResponseOrmEntity } from './survey-response.persistence.model';
import { SurveyResponseMapper } from './survey-response.mapper';

@Injectable()
export class SurveyResponseRepository
  extends TypeOrmRepositoryBase<SurveyResponseEntity, SurveyResponseOrmEntity>
  implements SurveyResponseRepositoryPort
{
  protected readonly entityClass = SurveyResponseOrmEntity;

  constructor(
    dataSource: DataSource,
    mapper: SurveyResponseMapper,
    @Inject(LOGGER_PORT) logger: LoggerPort,
  ) {
    super(dataSource, mapper, logger);
  }

  async existsBySurveyAndToken(surveyId: string, respondentToken: string): Promise<boolean> {
    const count = await this.dataSource
      .getRepository(SurveyResponseOrmEntity)
      .countBy({ surveyId, respondentToken });
    return count > 0;
  }
}
