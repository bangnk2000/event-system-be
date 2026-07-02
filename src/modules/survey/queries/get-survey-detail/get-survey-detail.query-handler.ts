import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@libs/exceptions';
import { GetSurveyDetailQuery } from './get-survey-detail.query';
import { SurveyDetailDto } from './get-survey-detail.response.dto';
import { SurveyOrmEntity } from '../../database/survey.persistence.model';

/** Read side: the survey + its questions, for a respondent to fill in. No responses/results here. */
@QueryHandler(GetSurveyDetailQuery)
export class GetSurveyDetailQueryHandler
  implements IQueryHandler<GetSurveyDetailQuery, SurveyDetailDto>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetSurveyDetailQuery): Promise<SurveyDetailDto> {
    const row = await this.dataSource
      .getRepository(SurveyOrmEntity)
      .findOne({ where: { id: query.surveyId } });
    if (!row) throw new NotFoundException('Survey not found');

    return {
      id: row.id,
      eventId: row.eventId,
      titleVi: row.titleVi,
      titleJa: row.titleJa,
      descriptionVi: row.descriptionVi,
      descriptionJa: row.descriptionJa,
      status: row.status,
      respondentScope: row.respondentScope,
      questions: [...row.questions]
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          questionId: q.questionId,
          order: q.order,
          type: q.type,
          promptVi: q.promptVi,
          promptJa: q.promptJa,
          required: q.required,
          options: q.options.map((o) => ({
            key: o.key,
            labelVi: o.labelVi,
            labelJa: o.labelJa,
          })),
        })),
    };
  }
}
