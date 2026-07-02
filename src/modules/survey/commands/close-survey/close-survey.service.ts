import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { CloseSurveyCommand } from './close-survey.command';
import { SURVEY_REPOSITORY, SurveyRepositoryPort } from '../../application/ports/survey.repository.port';
import {
  NotEventOrganizerError,
  SurveyInvalidStateError,
  SurveyNotFoundError,
} from '../../domain/survey.errors';

export type CloseSurveyResult = Result<
  string,
  SurveyNotFoundError | NotEventOrganizerError | SurveyInvalidStateError
>;

@CommandHandler(CloseSurveyCommand)
export class CloseSurveyService implements ICommandHandler<CloseSurveyCommand, CloseSurveyResult> {
  constructor(
    @Inject(SURVEY_REPOSITORY) private readonly repo: SurveyRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CloseSurveyCommand): Promise<CloseSurveyResult> {
    const survey = await this.repo.findOneById(command.surveyId);
    if (!survey) return Err(new SurveyNotFoundError());

    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: survey.eventId, userId: command.actorId }),
    );
    if (!check.isOrganizer) return Err(new NotEventOrganizerError());

    const result = survey.close(new Date());
    if (result.isErr()) return Err(result.unwrapErr());

    await this.repo.save(survey);
    return Ok(survey.id);
  }
}
