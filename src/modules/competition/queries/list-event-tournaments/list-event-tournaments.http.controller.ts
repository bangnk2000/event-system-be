import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ListEventTournamentsQuery } from './list-event-tournaments.query';
import { TournamentListItemDto } from './list-event-tournaments.response.dto';

@ApiTags('competition')
@Controller({ path: 'events', version: '1' })
export class ListEventTournamentsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':eventId/tournaments')
  @ApiOperation({ summary: 'List the tournaments of an event' })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiOkResponse({ type: [TournamentListItemDto] })
  async list(@Param('eventId') eventId: string): Promise<TournamentListItemDto[]> {
    return this.queryBus.execute(new ListEventTournamentsQuery({ eventId }));
  }
}
