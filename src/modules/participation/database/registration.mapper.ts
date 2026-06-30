import { Injectable } from '@nestjs/common';
import { Mapper } from '@libs/ddd';
import { RegistrationEntity } from '../domain/registration.entity';
import { RegistrationOrmEntity } from './registration.persistence.model';
import { RegistrationResponseDto } from '../dtos/registration.response.dto';

@Injectable()
export class RegistrationMapper
  implements Mapper<RegistrationEntity, RegistrationOrmEntity, RegistrationResponseDto>
{
  toDomain(record: RegistrationOrmEntity): RegistrationEntity {
    return new RegistrationEntity({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        eventId: record.eventId,
        mode: record.mode,
        userId: record.userId,
        teamName: record.teamName,
        memberIds: record.memberIds,
        status: record.status,
        checkedInAt: record.checkedInAt,
      },
    });
  }

  toPersistence(entity: RegistrationEntity): RegistrationOrmEntity {
    const props = entity.getProps();
    const row = new RegistrationOrmEntity();
    row.id = props.id;
    row.eventId = props.eventId;
    row.mode = props.mode;
    row.userId = props.userId;
    row.teamName = props.teamName;
    row.memberIds = props.memberIds;
    row.status = props.status;
    row.checkedInAt = props.checkedInAt;
    row.createdAt = props.createdAt;
    row.updatedAt = props.updatedAt;
    return row;
  }

  toResponse(entity: RegistrationEntity): RegistrationResponseDto {
    const props = entity.getProps();
    const dto = new RegistrationResponseDto();
    dto.id = props.id;
    dto.eventId = props.eventId;
    dto.mode = props.mode;
    dto.userId = props.userId;
    dto.teamName = props.teamName;
    dto.status = props.status;
    dto.checkedIn = props.checkedInAt !== null;
    return dto;
  }
}
