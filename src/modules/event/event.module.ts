import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EVENT_REPOSITORY } from './application/ports/event.repository.port';
import { CreateEventService } from './commands/create-event/create-event.service';
import { CreateEventHttpController } from './commands/create-event/create-event.http.controller';
import { GetEventListQueryHandler } from './queries/get-event-list/get-event-list.query-handler';
import { GetEventListHttpController } from './queries/get-event-list/get-event-list.http.controller';
import { EventRepository } from './database/event.repository';
import { EventMapper } from './database/event.mapper';

@Module({
  imports: [CqrsModule],
  controllers: [CreateEventHttpController, GetEventListHttpController],
  providers: [
    EventMapper,
    CreateEventService,
    GetEventListQueryHandler,
    { provide: EVENT_REPOSITORY, useClass: EventRepository }, // port -> adapter
  ],
})
export class EventModule {}
