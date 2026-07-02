import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { match } from 'oxide.ts';
import { IdResponse } from '@libs/ddd';
import { ApiStandardErrors, IdResponseDto } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { SubmitResponseCommand } from './submit-response.command';
import { SubmitResponseRequestDto } from './submit-response.request.dto';
import { SubmitResponseResult } from './submit-response.service';
import { throwSurveyHttpError } from '../map-survey-error';

@ApiTags('survey')
@Controller({ path: 'surveys', version: '1' })
export class SubmitResponseHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':surveyId/responses')
  @ApiOperation({
    summary: 'Submit a response to a survey',
    description:
      'Eligible participants only (registrants, or attendees per the survey). Anonymous to organizers; ' +
      'one response per person. The survey must be OPEN.',
  })
  @ApiParam({ name: 'surveyId', format: 'uuid' })
  @ApiCreatedResponse({ type: IdResponseDto, description: 'Response recorded; returns its id.' })
  @ApiStandardErrors(400, 403, 404, 409)
  async submit(
    @Param('surveyId') surveyId: string,
    @Body() body: SubmitResponseRequestDto,
    @CurrentUserId() actorId: string,
  ): Promise<IdResponse> {
    const result: SubmitResponseResult = await this.commandBus.execute(
      new SubmitResponseCommand({ surveyId, actorId, answers: body.answers }),
    );
    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => throwSurveyHttpError(error),
    });
  }
}
