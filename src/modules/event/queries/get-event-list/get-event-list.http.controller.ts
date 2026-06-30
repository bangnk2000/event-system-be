import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetEventListQuery } from './get-event-list.query';
import { GetEventListRequestDto } from './get-event-list.request.dto';
import { EventListItemDto } from './get-event-list.response.dto';

@Controller({ path: 'events', version: '1' })
export class GetEventListHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(@Query() query: GetEventListRequestDto): Promise<EventListItemDto[]> {
    return this.queryBus.execute(new GetEventListQuery({ lang: query.lang }));
  }
}
