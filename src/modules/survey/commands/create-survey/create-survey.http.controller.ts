import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { RespondentScope } from '../../domain/survey.types';
import { CreateSurveyCommand } from './create-survey.command';
import { CreateSurveyRequestDto } from './create-survey.request.dto';
import { CreateSurveyResult } from './create-survey.service';
import { throwSurveyHttpError } from '../map-survey-error';

@ApiTags('survey')
@Controller({ path: 'events', version: '1' })
export class CreateSurveyHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':eventId/surveys')
  @ApiOperation({
    summary: 'Create a post-event survey (DRAFT)',
    description: 'Organizer-only (cross-context check). Include at least one question.',
  })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto, description: 'Survey created; returns the survey id.' })
  @ApiStandardErrors(400, 403, 404)
  async create(
    @Param('eventId') eventId: string,
    @Body() body: CreateSurveyRequestDto,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: CreateSurveyResult = await this.commandBus.execute(
      new CreateSurveyCommand({
        eventId,
        actorId,
        titleVi: body.titleVi,
        titleJa: body.titleJa,
        descriptionVi: body.descriptionVi,
        descriptionJa: body.descriptionJa,
        respondentScope: body.respondentScope ?? RespondentScope.REGISTRANTS,
        questions: body.questions,
      }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwSurveyHttpError(error),
    });
  }
}
