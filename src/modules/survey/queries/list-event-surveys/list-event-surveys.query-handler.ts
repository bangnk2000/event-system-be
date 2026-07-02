import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { ListEventSurveysQuery } from './list-event-surveys.query';
import { SurveyListItemDto } from './list-event-surveys.response.dto';
import { SurveyOrmEntity } from '../../database/survey.persistence.model';
import { SurveyStatus } from '../../domain/survey.types';

/**
 * Read side: surveys of an event. Organizers see every survey; everyone else sees only OPEN ones
 * (a participant should not discover drafts/closed surveys). Results are never exposed here.
 */
@QueryHandler(ListEventSurveysQuery)
export class ListEventSurveysQueryHandler
  implements IQueryHandler<ListEventSurveysQuery, SurveyListItemDto[]>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: ListEventSurveysQuery): Promise<SurveyListItemDto[]> {
    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: query.eventId, userId: query.actorId }),
    );

    const rows = await this.dataSource
      .getRepository(SurveyOrmEntity)
      .find({ where: { eventId: query.eventId }, order: { createdAt: 'ASC' } });

    const visible = check.isOrganizer
      ? rows
      : rows.filter((row) => row.status === SurveyStatus.OPEN);

    return visible.map((row) => ({
      id: row.id,
      titleVi: row.titleVi,
      titleJa: row.titleJa,
      status: row.status,
      respondentScope: row.respondentScope,
      questionCount: row.questions.length,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
