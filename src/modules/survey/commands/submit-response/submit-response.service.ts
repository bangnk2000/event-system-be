import { createHmac } from 'node:crypto';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventParticipantQuery,
  IsEventParticipantResult,
} from '@libs/contracts/participation/is-event-participant.query';
import { SubmitResponseCommand } from './submit-response.command';
import { SurveyResponseEntity } from '../../domain/survey-response.entity';
import { RespondentScope } from '../../domain/survey.types';
import { SURVEY_REPOSITORY, SurveyRepositoryPort } from '../../application/ports/survey.repository.port';
import {
  SURVEY_RESPONSE_REPOSITORY,
  SurveyResponseRepositoryPort,
} from '../../application/ports/survey-response.repository.port';
import {
  AlreadyRespondedError,
  InvalidAnswerError,
  NotEligibleError,
  SurveyNotFoundError,
  SurveyNotOpenError,
} from '../../domain/survey.errors';

export type SubmitResponseResult = Result<
  string,
  SurveyNotFoundError | SurveyNotOpenError | NotEligibleError | AlreadyRespondedError | InvalidAnswerError
>;

@CommandHandler(SubmitResponseCommand)
export class SubmitResponseService
  implements ICommandHandler<SubmitResponseCommand, SubmitResponseResult>
{
  constructor(
    @Inject(SURVEY_REPOSITORY) private readonly surveys: SurveyRepositoryPort,
    @Inject(SURVEY_RESPONSE_REPOSITORY) private readonly responses: SurveyResponseRepositoryPort,
    private readonly queryBus: QueryBus,
    private readonly config: ConfigService,
  ) {}

  async execute(command: SubmitResponseCommand): Promise<SubmitResponseResult> {
    const survey = await this.surveys.findOneById(command.surveyId);
    if (!survey) return Err(new SurveyNotFoundError());
    if (!survey.isOpen()) return Err(new SurveyNotOpenError());

    // Eligibility (FR-SRV-05): ask the `participation` context over the QueryBus.
    const participation: IsEventParticipantResult = await this.queryBus.execute(
      new IsEventParticipantQuery({ eventId: survey.eventId, userId: command.actorId }),
    );
    const eligible =
      survey.respondentScope === RespondentScope.ATTENDEES
        ? participation.checkedIn
        : participation.registered;
    if (!eligible) return Err(new NotEligibleError());

    // Anonymous one-per-person guard: a one-way token, NOT the user's id (FR-SRV-06/08).
    const token = this.respondentToken(survey.id, command.actorId);
    if (await this.responses.existsBySurveyAndToken(survey.id, token)) {
      return Err(new AlreadyRespondedError());
    }

    const answers = survey.buildAnswers(command.answers);
    if (answers.isErr()) return Err(answers.unwrapErr());

    const response = SurveyResponseEntity.submit(
      survey.id,
      token,
      answers.unwrap(),
      this.responses.nextId(),
      new Date(),
    );
    await this.responses.insert(response);
    return Ok(response.id);
  }

  private respondentToken(surveyId: string, userId: string): string {
    const secret = this.config.get<string>('SURVEY_RESPONDENT_SALT') ?? 'dev-survey-salt';
    return createHmac('sha256', secret).update(`${surveyId}:${userId}`).digest('hex');
  }
}
