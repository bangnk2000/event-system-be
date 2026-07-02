import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { AddCompetitorCommand } from './add-competitor.command';
import { AddCompetitorRequestDto } from './add-competitor.request.dto';
import { AddCompetitorResult } from './add-competitor.service';
import { throwCompetitionHttpError } from '../map-competition-error';

@ApiTags('competition')
@Controller({ path: 'tournaments', version: '1' })
export class AddCompetitorHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':tournamentId/competitors')
  @ApiOperation({
    summary: 'Add a competitor (promote a registration)',
    description: 'Organizers only, while the tournament is DRAFT.',
  })
  @ApiParam({ name: 'tournamentId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto, description: 'Competitor added; returns its id.' })
  @ApiStandardErrors(400, 403, 404, 409)
  async addCompetitor(
    @Param('tournamentId') tournamentId: string,
    @Body() body: AddCompetitorRequestDto,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: AddCompetitorResult = await this.commandBus.execute(
      new AddCompetitorCommand({ tournamentId, actorId, registrationId: body.registrationId }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwCompetitionHttpError(error),
    });
  }
}
