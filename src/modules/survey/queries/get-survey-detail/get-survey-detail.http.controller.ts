import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { GetSurveyDetailQuery } from './get-survey-detail.query';
import { SurveyDetailDto } from './get-survey-detail.response.dto';

@ApiTags('survey')
@Controller({ path: 'surveys', version: '1' })
export class GetSurveyDetailHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':surveyId')
  @ApiOperation({ summary: 'Get a survey with its questions (to fill in)' })
  @ApiParam({ name: 'surveyId', format: 'uuid' })
  @ApiOkResponse({ type: SurveyDetailDto })
  @ApiStandardErrors(404)
  async get(@Param('surveyId') surveyId: string): Promise<SurveyDetailDto> {
    return this.queryBus.execute(new GetSurveyDetailQuery({ surveyId }));
  }
}
