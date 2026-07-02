import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { GetTournamentBracketQuery } from './get-tournament-bracket.query';
import { TournamentBracketDto } from './get-tournament-bracket.response.dto';

@ApiTags('competition')
@Controller({ path: 'tournaments', version: '1' })
export class GetTournamentBracketHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':tournamentId')
  @ApiOperation({ summary: 'Tournament bracket', description: 'Competitors + matches by round/group.' })
  @ApiParam({ name: 'tournamentId', format: 'uuid' })
  @ApiOkResponse({ type: TournamentBracketDto })
  @ApiStandardErrors(404)
  async bracket(@Param('tournamentId') tournamentId: string): Promise<TournamentBracketDto> {
    return this.queryBus.execute(new GetTournamentBracketQuery({ tournamentId }));
  }
}
