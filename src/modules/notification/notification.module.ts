import { Module } from '@nestjs/common';
import { NOTIFIER } from './application/ports/notifier.port';
import { ChatWorkAdapter } from './adapters/chatwork.adapter';
import { EventNotificationsHandler } from './application/event-handlers/event-notifications.handler';

@Module({
  providers: [
    { provide: NOTIFIER, useClass: ChatWorkAdapter }, // port -> adapter
    EventNotificationsHandler,
  ],
})
export class NotificationModule {}
