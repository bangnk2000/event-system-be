import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import {
  IsEventParticipantQuery,
  IsEventParticipantResult,
} from '@libs/contracts/participation/is-event-participant.query';
import { RegistrationOrmEntity } from '../../database/registration.persistence.model';
import { RegistrationStatus } from '../../domain/registration.types';

/** Answers the cross-context contract query (used by `survey` to gate who may respond). */
@QueryHandler(IsEventParticipantQuery)
export class IsEventParticipantQueryHandler
  implements IQueryHandler<IsEventParticipantQuery, IsEventParticipantResult>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: IsEventParticipantQuery): Promise<IsEventParticipantResult> {
    const rows = await this.dataSource.getRepository(RegistrationOrmEntity).find({
      where: {
        eventId: query.eventId,
        userId: query.userId,
        status: RegistrationStatus.REGISTERED,
      },
    });
    return {
      registered: rows.length > 0,
      checkedIn: rows.some((r) => r.checkedInAt !== null),
    };
  }
}
