import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { GetEventReportQuery } from './get-event-report.query';
import { EventReportDto } from './get-event-report.response.dto';

@ApiTags('event')
@Controller({ path: 'events', version: '1' })
export class GetEventReportHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':eventId/report')
  @ApiOperation({
    summary: 'Post-event summary report',
    description:
      'Organizer-only. Aggregates participation (registrations/check-in) and budget (planned vs actual) for the event.',
  })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiOkResponse({ type: EventReportDto })
  @ApiStandardErrors(403, 404)
  async report(
    @Param('eventId') eventId: string,
    @CurrentUserId() requesterId: string,
  ): Promise<EventReportDto> {
    return this.queryBus.execute(new GetEventReportQuery({ eventId, requesterId }));
  }
}
