import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NOTIFIER } from './application/ports/notifier.port';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from './application/ports/notification-preference.repository.port';
import { ChatWorkAdapter } from './adapters/chatwork.adapter';
import { EventNotificationsHandler } from './application/event-handlers/event-notifications.handler';
import { NotificationPreferenceMapper } from './database/notification-preference.mapper';
import { NotificationPreferenceRepository } from './database/notification-preference.repository';
import { UpdateNotificationPreferenceService } from './commands/update-notification-preference/update-notification-preference.service';
import { UpdateNotificationPreferenceHttpController } from './commands/update-notification-preference/update-notification-preference.http.controller';
import { GetNotificationPreferencesQueryHandler } from './queries/get-notification-preferences/get-notification-preferences.query-handler';
import { GetNotificationPreferencesHttpController } from './queries/get-notification-preferences/get-notification-preferences.http.controller';

@Module({
  imports: [CqrsModule],
  controllers: [
    UpdateNotificationPreferenceHttpController,
    GetNotificationPreferencesHttpController,
  ],
  providers: [
    { provide: NOTIFIER, useClass: ChatWorkAdapter }, // port -> adapter
    { provide: NOTIFICATION_PREFERENCE_REPOSITORY, useClass: NotificationPreferenceRepository },
    NotificationPreferenceMapper,
    EventNotificationsHandler,
    UpdateNotificationPreferenceService,
    GetNotificationPreferencesQueryHandler,
  ],
})
export class NotificationModule {}
