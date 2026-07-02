import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@libs/exceptions';
import {
  EventBudgetSummary,
  GetEventBudgetSummaryQuery,
} from '@libs/contracts/budget/get-event-budget-summary.query';
import {
  EventParticipationStats,
  GetEventParticipationStatsQuery,
} from '@libs/contracts/participation/get-event-participation-stats.query';
import { GetEventReportQuery } from './get-event-report.query';
import { EventReportDto } from './get-event-report.response.dto';
import { EventOrmEntity } from '../../database/event.persistence.model';

/**
 * Read side: the post-event summary report. Reads the event from its OWN context, then folds in
 * participation and budget numbers via cross-context contract queries over the QueryBus (no module
 * import). Organizer-only, since it exposes budget financials and full participation counts.
 */
@QueryHandler(GetEventReportQuery)
export class GetEventReportQueryHandler
  implements IQueryHandler<GetEventReportQuery, EventReportDto>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: GetEventReportQuery): Promise<EventReportDto> {
    const event = await this.dataSource
      .getRepository(EventOrmEntity)
      .findOne({ where: { id: query.eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (!event.committee.some((m) => m.userId === query.requesterId)) {
      throw new ForbiddenException('Only organizers may view the event report');
    }

    const [participation, budget]: [EventParticipationStats, EventBudgetSummary] =
      await Promise.all([
        this.queryBus.execute(new GetEventParticipationStatsQuery({ eventId: query.eventId })),
        this.queryBus.execute(new GetEventBudgetSummaryQuery({ eventId: query.eventId })),
      ]);

    return {
      event: {
        eventId: event.id,
        title: event.titleVi,
        status: event.status,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt.toISOString(),
        capacity: event.capacity,
      },
      participation,
      budget,
      generatedAt: new Date().toISOString(),
    };
  }
}
