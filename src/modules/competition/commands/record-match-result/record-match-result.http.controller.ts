import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { RecordMatchResultCommand } from './record-match-result.command';
import { RecordMatchResultRequestDto } from './record-match-result.request.dto';
import { RecordMatchResultResult } from './record-match-result.service';
import { throwCompetitionHttpError } from '../map-competition-error';

@ApiTags('competition')
@Controller({ path: 'tournaments', version: '1' })
export class RecordMatchResultHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':tournamentId/matches/:matchId/result')
  @ApiOperation({
    summary: 'Record a match result',
    description: 'Organizers only. Sets the score and auto-advances the winner in elimination rounds.',
  })
  @ApiParam({ name: 'tournamentId', format: 'uuid' })
  @ApiParam({ name: 'matchId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto, description: 'Recorded; returns the tournament id.' })
  @ApiStandardErrors(400, 403, 404, 409)
  async record(
    @Param('tournamentId') tournamentId: string,
    @Param('matchId') matchId: string,
    @Body() body: RecordMatchResultRequestDto,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: RecordMatchResultResult = await this.commandBus.execute(
      new RecordMatchResultCommand({
        tournamentId,
        matchId,
        actorId,
        scoreA: body.scoreA,
        scoreB: body.scoreB,
        detail: body.detail,
      }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwCompetitionHttpError(error),
    });
  }
}
