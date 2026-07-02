import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { GetSurveyResultsQuery } from './get-survey-results.query';
import { SurveyResultsDto } from './get-survey-results.response.dto';

@ApiTags('survey')
@Controller({ path: 'surveys', version: '1' })
export class GetSurveyResultsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':surveyId/results')
  @ApiOperation({
    summary: 'Get aggregated survey results (organizers only)',
    description: 'Anonymous aggregates + response rate. Only organizers of the event may view them.',
  })
  @ApiParam({ name: 'surveyId', format: 'uuid' })
  @ApiOkResponse({ type: SurveyResultsDto })
  @ApiStandardErrors(403, 404)
  async results(
    @Param('surveyId') surveyId: string,
    @CurrentUserId() actorId: string,
  ): Promise<SurveyResultsDto> {
    return this.queryBus.execute(new GetSurveyResultsQuery({ surveyId, actorId }));
  }
}
