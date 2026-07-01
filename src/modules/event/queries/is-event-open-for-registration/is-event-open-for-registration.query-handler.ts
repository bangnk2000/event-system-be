import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import {
  IsEventOpenForRegistrationQuery,
  IsEventOpenForRegistrationResult,
} from '@libs/contracts/event/is-event-open-for-registration.query';
import { EventOrmEntity } from '../../database/event.persistence.model';
import { EventStatusEnum } from '../../domain/value-objects/event-status.value-object';

/** Answers the cross-context contract query — read side, straight from the DB. */
@QueryHandler(IsEventOpenForRegistrationQuery)
export class IsEventOpenForRegistrationQueryHandler
  implements IQueryHandler<IsEventOpenForRegistrationQuery, IsEventOpenForRegistrationResult>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    query: IsEventOpenForRegistrationQuery,
  ): Promise<IsEventOpenForRegistrationResult> {
    const row = await this.dataSource
      .getRepository(EventOrmEntity)
      .findOne({ where: { id: query.eventId } });
    if (!row) return { eventExists: false, isOpen: false };
    return {
      eventExists: true,
      isOpen: row.status === EventStatusEnum.REGISTRATION_OPEN,
    };
  }
}
