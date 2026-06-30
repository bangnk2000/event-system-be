import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetEventListQuery } from './get-event-list.query';
import { EventListItemDto } from './get-event-list.response.dto';
import { EventOrmEntity } from '../../database/event.persistence.model';

/**
 * Read side: goes straight to the DB. No aggregate, no repository, no domain (CQRS by design).
 * Projects rows into a list DTO with the title already localized to the requested language.
 */
@QueryHandler(GetEventListQuery)
export class GetEventListQueryHandler
  implements IQueryHandler<GetEventListQuery, EventListItemDto[]>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetEventListQuery): Promise<EventListItemDto[]> {
    const rows = await this.dataSource
      .getRepository(EventOrmEntity)
      .find({ order: { startAt: 'ASC' } });

    return rows.map((row) => ({
      id: row.id,
      title: query.lang === 'ja' ? row.titleJa ?? row.titleVi : row.titleVi,
      type: row.type,
      status: row.status,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
    }));
  }
}
