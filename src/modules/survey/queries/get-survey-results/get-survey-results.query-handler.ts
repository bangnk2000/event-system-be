import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@libs/exceptions';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import {
  EventParticipationStats,
  GetEventParticipationStatsQuery,
} from '@libs/contracts/participation/get-event-participation-stats.query';
import { GetSurveyResultsQuery } from './get-survey-results.query';
import { QuestionResultView, SurveyResultsDto } from './get-survey-results.response.dto';
import { SurveyOrmEntity, SurveyQuestionRow } from '../../database/survey.persistence.model';
import { SurveyResponseOrmEntity, SurveyAnswerRow } from '../../database/survey-response.persistence.model';
import { QuestionType, RespondentScope } from '../../domain/survey.types';
import { RATING_MAX, RATING_MIN } from '../../domain/survey-question';

/**
 * Read side: aggregated survey results — ORGANIZERS ONLY (FR-SRV-08). Responses are anonymous, so
 * this returns only aggregates (never a respondent identity) plus the response rate.
 */
@QueryHandler(GetSurveyResultsQuery)
export class GetSurveyResultsQueryHandler
  implements IQueryHandler<GetSurveyResultsQuery, SurveyResultsDto>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: GetSurveyResultsQuery): Promise<SurveyResultsDto> {
    const survey = await this.dataSource
      .getRepository(SurveyOrmEntity)
      .findOne({ where: { id: query.surveyId } });
    if (!survey) throw new NotFoundException('Survey not found');

    const auth: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: survey.eventId, userId: query.actorId }),
    );
    if (!auth.isOrganizer) {
      throw new ForbiddenException('Only an organizer of the event can view survey results');
    }

    const responses = await this.dataSource
      .getRepository(SurveyResponseOrmEntity)
      .find({ where: { surveyId: survey.id } });
    const allAnswers = responses.flatMap((r) => r.answers);

    const stats: EventParticipationStats = await this.queryBus.execute(
      new GetEventParticipationStatsQuery({ eventId: survey.eventId }),
    );
    const eligible =
      survey.respondentScope === RespondentScope.ATTENDEES ? stats.checkedIn : stats.registered;
    const responded = responses.length;

    return {
      surveyId: survey.id,
      eventId: survey.eventId,
      status: survey.status,
      respondentScope: survey.respondentScope,
      responded,
      eligible,
      responseRate: eligible === 0 ? 0 : Math.round((responded / eligible) * 100) / 100,
      questions: [...survey.questions]
        .sort((a, b) => a.order - b.order)
        .map((question) =>
          this.aggregate(
            question,
            allAnswers.filter((a) => a.questionId === question.questionId),
          ),
        ),
    };
  }

  private aggregate(question: SurveyQuestionRow, answers: SurveyAnswerRow[]): QuestionResultView {
    const base: QuestionResultView = {
      questionId: question.questionId,
      type: question.type,
      promptVi: question.promptVi,
      promptJa: question.promptJa,
      required: question.required,
      answerCount: answers.length,
      average: null,
    };

    switch (question.type) {
      case QuestionType.RATING: {
        const values = answers
          .map((a) => a.ratingValue)
          .filter((v): v is number => v !== null);
        const sum = values.reduce((acc, v) => acc + v, 0);
        base.average = values.length === 0 ? null : Math.round((sum / values.length) * 100) / 100;
        base.distribution = [];
        for (let rating = RATING_MIN; rating <= RATING_MAX; rating++) {
          base.distribution.push({ rating, count: values.filter((v) => v === rating).length });
        }
        return base;
      }
      case QuestionType.SINGLE_CHOICE:
      case QuestionType.MULTIPLE_CHOICE: {
        base.options = question.options.map((option) => ({
          key: option.key,
          labelVi: option.labelVi,
          labelJa: option.labelJa,
          count: answers.filter((a) => (a.choiceKeys ?? []).includes(option.key)).length,
        }));
        return base;
      }
      case QuestionType.TEXT: {
        base.textAnswers = answers
          .map((a) => a.textValue)
          .filter((v): v is string => v !== null && v !== '');
        return base;
      }
    }
  }
}
