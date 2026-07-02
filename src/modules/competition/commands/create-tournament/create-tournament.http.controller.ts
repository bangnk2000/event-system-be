import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { CreateTournamentCommand } from './create-tournament.command';
import { CreateTournamentRequestDto } from './create-tournament.request.dto';
import { CreateTournamentResult } from './create-tournament.service';
import { throwCompetitionHttpError } from '../map-competition-error';

@ApiTags('competition')
@Controller({ path: 'events', version: '1' })
export class CreateTournamentHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':eventId/tournaments')
  @ApiOperation({
    summary: 'Create a tournament for an event',
    description: 'Organizers only. Choose the format; add competitors and seed afterwards.',
  })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto, description: 'Tournament created; returns its id.' })
  @ApiStandardErrors(403, 404)
  async create(
    @Param('eventId') eventId: string,
    @Body() body: CreateTournamentRequestDto,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: CreateTournamentResult = await this.commandBus.execute(
      new CreateTournamentCommand({
        eventId,
        actorId,
        nameVi: body.nameVi,
        nameJa: body.nameJa,
        format: body.format,
        numGroups: body.numGroups,
        advancePerGroup: body.advancePerGroup,
      }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwCompetitionHttpError(error),
    });
  }
}
