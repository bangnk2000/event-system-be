import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateNotificationPreferenceCommand } from './update-notification-preference.command';
import { NotificationPreferenceEntity } from '../../domain/notification-preference.entity';
import {
  NOTIFICATION_PREFERENCE_REPOSITORY,
  NotificationPreferenceRepositoryPort,
} from '../../application/ports/notification-preference.repository.port';
import {
  buildPreferenceResponse,
  NotificationPreferenceResponseDto,
} from '../../dtos/notification-preference.response.dto';

@CommandHandler(UpdateNotificationPreferenceCommand)
export class UpdateNotificationPreferenceService
  implements ICommandHandler<UpdateNotificationPreferenceCommand, NotificationPreferenceResponseDto>
{
  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly repo: NotificationPreferenceRepositoryPort,
  ) {}

  async execute(
    command: UpdateNotificationPreferenceCommand,
  ): Promise<NotificationPreferenceResponseDto> {
    const now = new Date();
    const preference =
      (await this.repo.findOneById(command.userId)) ??
      NotificationPreferenceEntity.createDefault(command.userId, now);

    preference.setEnabled(command.type, command.enabled, now);
    await this.repo.save(preference); // TypeORM save() upserts by primary key (= userId)

    return buildPreferenceResponse(preference.userId, preference.disabledTypes);
  }
}
