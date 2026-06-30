import { Injectable } from '@nestjs/common';
import { Mapper } from '@libs/ddd';
import { EventEntity } from '../domain/event.entity';
import { MultilingualText } from '../domain/value-objects/multilingual-text.value-object';
import { DateTimeRange } from '../domain/value-objects/date-time-range.value-object';
import { EventStatus } from '../domain/value-objects/event-status.value-object';
import { RegistrationPolicy } from '../domain/value-objects/registration-policy.value-object';
import {
  OrganizerRole,
  OrganizingCommitteeMember,
} from '../domain/value-objects/organizing-committee-member.value-object';
import { EventOrmEntity } from './event.persistence.model';
import { EventResponseDto } from '../dtos/event.response.dto';

@Injectable()
export class EventMapper implements Mapper<EventEntity, EventOrmEntity, EventResponseDto> {
  /** Reconstitution: rebuild the entity DIRECTLY (no factory) so loading does NOT re-emit events. */
  toDomain(record: EventOrmEntity): EventEntity {
    return new EventEntity({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        title: MultilingualText.create(record.titleVi, record.titleJa ?? undefined),
        description: record.descriptionVi
          ? MultilingualText.create(record.descriptionVi, record.descriptionJa ?? undefined)
          : null,
        type: record.type,
        status: EventStatus.of(record.status),
        schedule: DateTimeRange.create(record.startAt, record.endAt),
        location: record.location,
        capacity: record.capacity,
        registrationPolicy: RegistrationPolicy.create(
          record.registrationMode,
          record.registrationDeadline,
        ),
        committee: record.committee.map((m) =>
          m.role === OrganizerRole.OWNER
            ? OrganizingCommitteeMember.owner(m.userId)
            : OrganizingCommitteeMember.member(m.userId),
        ),
      },
    });
  }

  toPersistence(entity: EventEntity): EventOrmEntity {
    const props = entity.getProps();
    const row = new EventOrmEntity();
    row.id = props.id;
    row.titleVi = props.title.vi;
    row.titleJa = props.title.ja ?? null;
    row.descriptionVi = props.description?.vi ?? null;
    row.descriptionJa = props.description?.ja ?? null;
    row.type = props.type;
    row.status = props.status.value;
    row.startAt = props.schedule.startAt;
    row.endAt = props.schedule.endAt;
    row.location = props.location;
    row.capacity = props.capacity;
    row.registrationMode = props.registrationPolicy.mode;
    row.registrationDeadline = props.registrationPolicy.deadline;
    row.committee = props.committee.map((m) => ({ userId: m.userId, role: m.role }));
    row.createdAt = props.createdAt;
    row.updatedAt = props.updatedAt;
    return row;
  }

  toResponse(entity: EventEntity): EventResponseDto {
    const props = entity.getProps();
    const dto = new EventResponseDto();
    dto.id = props.id;
    dto.titleVi = props.title.vi;
    dto.titleJa = props.title.ja ?? null;
    dto.type = props.type;
    dto.status = props.status.value;
    dto.startAt = props.schedule.startAt.toISOString();
    dto.endAt = props.schedule.endAt.toISOString();
    dto.createdAt = props.createdAt.toISOString();
    return dto;
  }
}
