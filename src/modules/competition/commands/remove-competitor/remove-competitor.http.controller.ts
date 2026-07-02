import { Controller, Delete, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { RemoveCompetitorCommand } from './remove-competitor.command';
import { RemoveCompetitorResult } from './remove-competitor.service';
import { throwCompetitionHttpError } from '../map-competition-error';

@ApiTags('competition')
@Controller({ path: 'tournaments', version: '1' })
export class RemoveCompetitorHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':tournamentId/competitors/:competitorId')
  @ApiOperation({
    summary: 'Remove a competitor',
    description: 'Organizers only, while the tournament is DRAFT.',
  })
  @ApiParam({ name: 'tournamentId', format: 'uuid' })
  @ApiParam({ name: 'competitorId', format: 'uuid' })
  @ApiOkResponse({ type: IdResponseDto, description: 'Competitor removed; returns the tournament id.' })
  @ApiStandardErrors(403, 404, 409)
  async removeCompetitor(
    @Param('tournamentId') tournamentId: string,
    @Param('competitorId') competitorId: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: RemoveCompetitorResult = await this.commandBus.execute(
      new RemoveCompetitorCommand({ tournamentId, competitorId, actorId }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwCompetitionHttpError(error),
    });
  }
}
