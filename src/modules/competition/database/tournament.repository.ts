import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepositoryBase } from '@libs/db/typeorm-repository.base';
import { LOGGER_PORT, LoggerPort } from '@libs/ports/logger.port';
import { TournamentEntity } from '../domain/tournament.entity';
import { TournamentRepositoryPort } from '../application/ports/tournament.repository.port';
import { TournamentOrmEntity } from './tournament.persistence.model';
import { TournamentMapper } from './tournament.mapper';

@Injectable()
export class TournamentRepository
  extends TypeOrmRepositoryBase<TournamentEntity, TournamentOrmEntity>
  implements TournamentRepositoryPort
{
  protected readonly entityClass = TournamentOrmEntity;

  constructor(
    dataSource: DataSource,
    mapper: TournamentMapper,
    @Inject(LOGGER_PORT) logger: LoggerPort,
  ) {
    super(dataSource, mapper, logger);
  }
}
