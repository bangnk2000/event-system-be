import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { GetTournamentStandingsQuery } from './get-tournament-standings.query';
import { TournamentStandingsDto } from './get-tournament-standings.response.dto';

@ApiTags('competition')
@Controller({ path: 'tournaments', version: '1' })
export class GetTournamentStandingsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':tournamentId/standings')
  @ApiOperation({
    summary: 'Tournament standings',
    description: 'Computed from recorded scores; one table per group for group→knockout.',
  })
  @ApiParam({ name: 'tournamentId', format: 'uuid' })
  @ApiOkResponse({ type: TournamentStandingsDto })
  @ApiStandardErrors(404)
  async standings(@Param('tournamentId') tournamentId: string): Promise<TournamentStandingsDto> {
    return this.queryBus.execute(new GetTournamentStandingsQuery({ tournamentId }));
  }
}
