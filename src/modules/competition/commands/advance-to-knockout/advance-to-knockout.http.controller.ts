import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { AdvanceToKnockoutCommand } from './advance-to-knockout.command';
import { AdvanceToKnockoutResult } from './advance-to-knockout.service';
import { throwCompetitionHttpError } from '../map-competition-error';

@ApiTags('competition')
@Controller({ path: 'tournaments', version: '1' })
export class AdvanceToKnockoutHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':tournamentId/advance-knockout')
  @ApiOperation({
    summary: 'Advance a group→knockout tournament to its knockout stage',
    description: 'Organizers only, once every group match has a result. Seeds top-K per group into a bracket.',
  })
  @ApiParam({ name: 'tournamentId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto, description: 'Knockout generated; returns the tournament id.' })
  @ApiStandardErrors(403, 404, 409)
  async advance(
    @Param('tournamentId') tournamentId: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: AdvanceToKnockoutResult = await this.commandBus.execute(
      new AdvanceToKnockoutCommand({ tournamentId, actorId }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwCompetitionHttpError(error),
    });
  }
}
