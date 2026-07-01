import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { GetEventListQuery } from './get-event-list.query';
import { GetEventListRequestDto } from './get-event-list.request.dto';
import { EventListItemDto } from './get-event-list.response.dto';

@ApiTags('events')
@Controller({ path: 'events', version: '1' })
export class GetEventListHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List events', description: 'Titles localized to the requested language.' })
  @ApiOkResponse({ type: EventListItemDto, isArray: true })
  @ApiStandardErrors()
  async list(@Query() query: GetEventListRequestDto): Promise<EventListItemDto[]> {
    return this.queryBus.execute(new GetEventListQuery({ lang: query.lang }));
  }
}
