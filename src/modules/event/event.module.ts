import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EVENT_REPOSITORY } from './application/ports/event.repository.port';
import { CreateEventService } from './commands/create-event/create-event.service';
import { CreateEventHttpController } from './commands/create-event/create-event.http.controller';
import { PublishEventService } from './commands/publish-event/publish-event.service';
import { PublishEventHttpController } from './commands/publish-event/publish-event.http.controller';
import { OpenRegistrationService } from './commands/open-registration/open-registration.service';
import { OpenRegistrationHttpController } from './commands/open-registration/open-registration.http.controller';
import { RescheduleEventService } from './commands/reschedule-event/reschedule-event.service';
import { RescheduleEventHttpController } from './commands/reschedule-event/reschedule-event.http.controller';
import { CancelEventService } from './commands/cancel-event/cancel-event.service';
import { CancelEventHttpController } from './commands/cancel-event/cancel-event.http.controller';
import { GetEventListQueryHandler } from './queries/get-event-list/get-event-list.query-handler';
import { GetEventListHttpController } from './queries/get-event-list/get-event-list.http.controller';
import { IsEventOrganizerQueryHandler } from './queries/is-event-organizer/is-event-organizer.query-handler';
import { EventRepository } from './database/event.repository';
import { EventMapper } from './database/event.mapper';

@Module({
  imports: [CqrsModule],
  controllers: [
    CreateEventHttpController,
    PublishEventHttpController,
    OpenRegistrationHttpController,
    RescheduleEventHttpController,
    CancelEventHttpController,
    GetEventListHttpController,
  ],
  providers: [
    EventMapper,
    CreateEventService,
    PublishEventService,
    OpenRegistrationService,
    RescheduleEventService,
    CancelEventService,
    GetEventListQueryHandler,
    IsEventOrganizerQueryHandler,
    { provide: EVENT_REPOSITORY, useClass: EventRepository }, // port -> adapter
  ],
})
export class EventModule {}
