import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ListEventTournamentsQuery } from './list-event-tournaments.query';
import { TournamentListItemDto } from './list-event-tournaments.response.dto';
import { TournamentOrmEntity } from '../../database/tournament.persistence.model';

/** Read side: all tournaments of an event with a competitor count, straight from the DB. */
@QueryHandler(ListEventTournamentsQuery)
export class ListEventTournamentsQueryHandler
  implements IQueryHandler<ListEventTournamentsQuery, TournamentListItemDto[]>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: ListEventTournamentsQuery): Promise<TournamentListItemDto[]> {
    const rows = await this.dataSource
      .getRepository(TournamentOrmEntity)
      .find({ where: { eventId: query.eventId }, order: { createdAt: 'ASC' } });

    return rows.map((row) => ({
      id: row.id,
      name: row.nameVi,
      format: row.format,
      status: row.status,
      stage: row.stage,
      competitorCount: row.competitors.length,
    }));
  }
}
