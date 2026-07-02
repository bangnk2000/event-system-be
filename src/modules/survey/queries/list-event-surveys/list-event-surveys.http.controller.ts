import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { ListEventSurveysQuery } from './list-event-surveys.query';
import { SurveyListItemDto } from './list-event-surveys.response.dto';

@ApiTags('survey')
@Controller({ path: 'events', version: '1' })
export class ListEventSurveysHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':eventId/surveys')
  @ApiOperation({
    summary: 'List an event’s surveys',
    description: 'Organizers see all; other users see only OPEN surveys.',
  })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiOkResponse({ type: [SurveyListItemDto] })
  @ApiStandardErrors()
  async list(
    @Param('eventId') eventId: string,
    @CurrentUserId() actorId: string,
  ): Promise<SurveyListItemDto[]> {
    return this.queryBus.execute(new ListEventSurveysQuery({ eventId, actorId }));
  }
}
