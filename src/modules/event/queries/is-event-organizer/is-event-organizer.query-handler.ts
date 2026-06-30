import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { EventOrmEntity } from '../../database/event.persistence.model';

/** Answers the cross-context contract query — read side, straight from the DB. */
@QueryHandler(IsEventOrganizerQuery)
export class IsEventOrganizerQueryHandler
  implements IQueryHandler<IsEventOrganizerQuery, IsEventOrganizerResult>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: IsEventOrganizerQuery): Promise<IsEventOrganizerResult> {
    const row = await this.dataSource
      .getRepository(EventOrmEntity)
      .findOne({ where: { id: query.eventId } });
    if (!row) return { eventExists: false, isOrganizer: false };
    return {
      eventExists: true,
      isOrganizer: row.committee.some((m) => m.userId === query.userId),
    };
  }
}
