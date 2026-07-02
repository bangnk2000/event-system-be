import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import {
  EventRegistrationSummary,
  GetEventRegistrationsQuery,
  GetEventRegistrationsResult,
} from '@libs/contracts/participation/get-event-registrations.query';
import { RegistrationOrmEntity } from '../../database/registration.persistence.model';
import { ParticipationMode, RegistrationStatus } from '../../domain/registration.types';

/** Answers the cross-context contract query (used by `competition` to build its competitor list). */
@QueryHandler(GetEventRegistrationsQuery)
export class GetEventRegistrationsQueryHandler
  implements IQueryHandler<GetEventRegistrationsQuery, GetEventRegistrationsResult>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetEventRegistrationsQuery): Promise<GetEventRegistrationsResult> {
    const rows = await this.dataSource.getRepository(RegistrationOrmEntity).find({
      where: { eventId: query.eventId, status: RegistrationStatus.REGISTERED },
      order: { createdAt: 'ASC' },
    });
    return rows.map(
      (r): EventRegistrationSummary => ({
        registrationId: r.id,
        mode: r.mode,
        displayName: r.mode === ParticipationMode.TEAM ? (r.teamName ?? r.userId) : r.userId,
      }),
    );
  }
}
