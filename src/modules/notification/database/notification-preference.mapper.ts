import { Injectable } from '@nestjs/common';
import { Mapper } from '@libs/ddd';
import { NotificationPreferenceEntity } from '../domain/notification-preference.entity';
import { NotificationPreferenceOrmEntity } from './notification-preference.persistence.model';
import {
  buildPreferenceResponse,
  NotificationPreferenceResponseDto,
} from '../dtos/notification-preference.response.dto';

@Injectable()
export class NotificationPreferenceMapper
  implements
    Mapper<
      NotificationPreferenceEntity,
      NotificationPreferenceOrmEntity,
      NotificationPreferenceResponseDto
    >
{
  toDomain(record: NotificationPreferenceOrmEntity): NotificationPreferenceEntity {
    return new NotificationPreferenceEntity({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: { disabledTypes: record.disabledTypes },
    });
  }

  toPersistence(entity: NotificationPreferenceEntity): NotificationPreferenceOrmEntity {
    const props = entity.getProps();
    const row = new NotificationPreferenceOrmEntity();
    row.id = props.id;
    row.disabledTypes = props.disabledTypes;
    row.createdAt = props.createdAt;
    row.updatedAt = props.updatedAt;
    return row;
  }

  toResponse(entity: NotificationPreferenceEntity): NotificationPreferenceResponseDto {
    return buildPreferenceResponse(entity.userId, entity.disabledTypes);
  }
}
