import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { CreateSurveyCommand } from './create-survey.command';
import { SurveyEntity } from '../../domain/survey.entity';
import { SurveyQuestion } from '../../domain/survey-question';
import { MultilingualText } from '../../domain/value-objects/multilingual-text.value-object';
import { SURVEY_REPOSITORY, SurveyRepositoryPort } from '../../application/ports/survey.repository.port';
import { SurveyEventNotFoundError, NotEventOrganizerError } from '../../domain/survey.errors';

export type CreateSurveyResult = Result<
  string,
  SurveyEventNotFoundError | NotEventOrganizerError
>;

@CommandHandler(CreateSurveyCommand)
export class CreateSurveyService
  implements ICommandHandler<CreateSurveyCommand, CreateSurveyResult>
{
  constructor(
    @Inject(SURVEY_REPOSITORY) private readonly repo: SurveyRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateSurveyCommand): Promise<CreateSurveyResult> {
    // Cross-context authorization — ask the `event` context over the QueryBus (no module import).
    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: command.eventId, userId: command.actorId }),
    );
    if (!check.eventExists) return Err(new SurveyEventNotFoundError());
    if (!check.isOrganizer) return Err(new NotEventOrganizerError());

    const questions = command.questions.map(
      (q, index) =>
        new SurveyQuestion(
          this.repo.nextId(),
          index,
          q.type,
          MultilingualText.create(q.promptVi, q.promptJa),
          q.required,
          (q.options ?? []).map((o) => ({
            key: o.key,
            label: MultilingualText.create(o.labelVi, o.labelJa),
          })),
        ),
    );

    const survey = SurveyEntity.create(
      {
        eventId: command.eventId,
        ownerId: command.actorId,
        title: MultilingualText.create(command.titleVi, command.titleJa),
        description: command.descriptionVi
          ? MultilingualText.create(command.descriptionVi, command.descriptionJa)
          : null,
        respondentScope: command.respondentScope,
        questions,
      },
      this.repo.nextId(),
      new Date(),
    );
    await this.repo.insert(survey);
    return Ok(survey.id);
  }
}
