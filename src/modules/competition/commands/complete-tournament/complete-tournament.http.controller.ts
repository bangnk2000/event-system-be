import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { CompleteTournamentCommand } from './complete-tournament.command';
import { CompleteTournamentResult } from './complete-tournament.service';
import { throwCompetitionHttpError } from '../map-competition-error';

@ApiTags('competition')
@Controller({ path: 'tournaments', version: '1' })
export class CompleteTournamentHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':tournamentId/complete')
  @ApiOperation({
    summary: 'Complete a tournament',
    description: 'Organizers only, once every match has a result. Determines the champion.',
  })
  @ApiParam({ name: 'tournamentId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto, description: 'Completed; returns the tournament id.' })
  @ApiStandardErrors(403, 404, 409)
  async complete(
    @Param('tournamentId') tournamentId: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: CompleteTournamentResult = await this.commandBus.execute(
      new CompleteTournamentCommand({ tournamentId, actorId }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwCompetitionHttpError(error),
    });
  }
}
