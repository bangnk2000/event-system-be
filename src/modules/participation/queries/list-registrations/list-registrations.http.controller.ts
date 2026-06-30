import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ListRegistrationsQuery } from './list-registrations.query';
import { RegistrationListItemDto } from './list-registrations.response.dto';

@Controller({ path: 'events', version: '1' })
export class ListRegistrationsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':eventId/registrations')
  async list(@Param('eventId') eventId: string): Promise<RegistrationListItemDto[]> {
    return this.queryBus.execute(new ListRegistrationsQuery({ eventId }));
  }
}
