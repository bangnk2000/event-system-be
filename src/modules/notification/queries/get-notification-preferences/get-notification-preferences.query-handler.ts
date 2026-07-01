import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetNotificationPreferencesQuery } from './get-notification-preferences.query';
import { NotificationPreferenceOrmEntity } from '../../database/notification-preference.persistence.model';
import {
  buildPreferenceResponse,
  NotificationPreferenceResponseDto,
} from '../../dtos/notification-preference.response.dto';

/**
 * Read side: reads the user's opt-out row straight from the DB (no aggregate). A user with no
 * stored row gets all-enabled defaults (opt-out model).
 */
@QueryHandler(GetNotificationPreferencesQuery)
export class GetNotificationPreferencesQueryHandler
  implements IQueryHandler<GetNotificationPreferencesQuery, NotificationPreferenceResponseDto>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    query: GetNotificationPreferencesQuery,
  ): Promise<NotificationPreferenceResponseDto> {
    const row = await this.dataSource
      .getRepository(NotificationPreferenceOrmEntity)
      .findOne({ where: { id: query.userId } });

    return buildPreferenceResponse(query.userId, row?.disabledTypes ?? []);
  }
}
