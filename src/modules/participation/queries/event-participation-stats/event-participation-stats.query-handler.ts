import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import {
  EventParticipationStats,
  GetEventParticipationStatsQuery,
} from '@libs/contracts/participation/get-event-participation-stats.query';
import { RegistrationOrmEntity } from '../../database/registration.persistence.model';
import { ParticipationMode, RegistrationStatus } from '../../domain/registration.types';

/** Answers the cross-context contract query for the event report — read side, straight from the DB. */
@QueryHandler(GetEventParticipationStatsQuery)
export class GetEventParticipationStatsQueryHandler
  implements IQueryHandler<GetEventParticipationStatsQuery, EventParticipationStats>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetEventParticipationStatsQuery): Promise<EventParticipationStats> {
    const rows = await this.dataSource
      .getRepository(RegistrationOrmEntity)
      .find({ where: { eventId: query.eventId } });

    const active = rows.filter((r) => r.status === RegistrationStatus.REGISTERED);
    const registered = active.length;
    const checkedIn = active.filter((r) => r.checkedInAt !== null).length;

    return {
      registered,
      cancelled: rows.filter((r) => r.status === RegistrationStatus.CANCELLED).length,
      checkedIn,
      individual: active.filter((r) => r.mode === ParticipationMode.INDIVIDUAL).length,
      team: active.filter((r) => r.mode === ParticipationMode.TEAM).length,
      checkInRate: registered === 0 ? 0 : Math.round((checkedIn / registered) * 100) / 100,
    };
  }
}
