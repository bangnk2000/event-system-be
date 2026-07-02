import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { CloseSurveyCommand } from './close-survey.command';
import { CloseSurveyResult } from './close-survey.service';
import { throwSurveyHttpError } from '../map-survey-error';

@ApiTags('survey')
@Controller({ path: 'surveys', version: '1' })
export class CloseSurveyHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':surveyId/close')
  @ApiOperation({
    summary: 'Close a survey',
    description: 'Organizer-only. Stops accepting responses; requires the survey to be OPEN.',
  })
  @ApiParam({ name: 'surveyId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiStandardErrors(403, 404, 409)
  async close(
    @Param('surveyId') surveyId: string,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: CloseSurveyResult = await this.commandBus.execute(
      new CloseSurveyCommand({ surveyId, actorId }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwSurveyHttpError(error),
    });
  }
}
