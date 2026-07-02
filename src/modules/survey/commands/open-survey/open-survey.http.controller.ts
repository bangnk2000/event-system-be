import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { OpenSurveyCommand } from './open-survey.command';
import { OpenSurveyResult } from './open-survey.service';
import { throwSurveyHttpError } from '../map-survey-error';

@ApiTags('survey')
@Controller({ path: 'surveys', version: '1' })
export class OpenSurveyHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':surveyId/open')
  @ApiOperation({
    summary: 'Open a survey for responses',
    description: 'Organizer-only. Requires the survey to be DRAFT with at least one question.',
  })
  @ApiParam({ name: 'surveyId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiStandardErrors(403, 404, 409)
  async open(
    @Param('surveyId') surveyId: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: OpenSurveyResult = await this.commandBus.execute(
      new OpenSurveyCommand({ surveyId, actorId }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwSurveyHttpError(error),
    });
  }
}
