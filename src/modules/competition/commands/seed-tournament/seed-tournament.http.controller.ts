import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { SeedTournamentCommand } from './seed-tournament.command';
import { SeedTournamentResult } from './seed-tournament.service';
import { throwCompetitionHttpError } from '../map-competition-error';

@ApiTags('competition')
@Controller({ path: 'tournaments', version: '1' })
export class SeedTournamentHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':tournamentId/seed')
  @ApiOperation({
    summary: 'Seed a tournament (generate the matches)',
    description: 'Organizers only, from DRAFT. Locks the competitor list and builds the bracket/schedule.',
  })
  @ApiParam({ name: 'tournamentId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto, description: 'Seeded; returns the tournament id.' })
  @ApiStandardErrors(400, 403, 404, 409)
  async seed(
    @Param('tournamentId') tournamentId: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: SeedTournamentResult = await this.commandBus.execute(
      new SeedTournamentCommand({ tournamentId, actorId }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwCompetitionHttpError(error),
    });
  }
}
