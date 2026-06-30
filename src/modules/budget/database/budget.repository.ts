import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepositoryBase } from '@libs/db/typeorm-repository.base';
import { LOGGER_PORT, LoggerPort } from '@libs/ports/logger.port';
import { BudgetEntity } from '../domain/budget.entity';
import { BudgetRepositoryPort } from '../application/ports/budget.repository.port';
import { BudgetOrmEntity } from './budget.persistence.model';
import { BudgetMapper } from './budget.mapper';

@Injectable()
export class BudgetRepository
  extends TypeOrmRepositoryBase<BudgetEntity, BudgetOrmEntity>
  implements BudgetRepositoryPort
{
  protected readonly entityClass = BudgetOrmEntity;

  constructor(
    dataSource: DataSource,
    mapper: BudgetMapper,
    @Inject(LOGGER_PORT) logger: LoggerPort,
  ) {
    super(dataSource, mapper, logger);
  }

  async findByEventId(eventId: string): Promise<BudgetEntity | null> {
    const row = await this.dataSource.getRepository(BudgetOrmEntity).findOne({ where: { eventId } });
    return row ? (this.mapper as BudgetMapper).toDomain(row) : null;
  }
}
