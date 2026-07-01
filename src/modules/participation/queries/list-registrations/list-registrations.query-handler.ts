import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ListRegistrationsQuery } from './list-registrations.query';
import { RegistrationListItemDto } from './list-registrations.response.dto';
import { RegistrationOrmEntity } from '../../database/registration.persistence.model';

/** Read side: lists an event's registrations straight from the DB (no aggregate). */
@QueryHandler(ListRegistrationsQuery)
export class ListRegistrationsQueryHandler
  implements IQueryHandler<ListRegistrationsQuery, RegistrationListItemDto[]>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: ListRegistrationsQuery): Promise<RegistrationListItemDto[]> {
    const rows = await this.dataSource.getRepository(RegistrationOrmEntity).find({
      where: { eventId: query.eventId },
      order: { createdAt: 'ASC' },
    });

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      mode: row.mode,
      teamName: row.teamName,
      status: row.status,
      checkedIn: row.checkedInAt !== null,
    }));
  }
}
