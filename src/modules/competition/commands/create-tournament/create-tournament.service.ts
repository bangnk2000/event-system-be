import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { CreateTournamentCommand } from './create-tournament.command';
import { TournamentEntity } from '../../domain/tournament.entity';
import { MultilingualText } from '../../domain/value-objects/multilingual-text.value-object';
import { SeedMethod, TournamentConfig } from '../../domain/competition.types';
import {
  TOURNAMENT_REPOSITORY,
  TournamentRepositoryPort,
} from '../../application/ports/tournament.repository.port';
import {
  CompetitionEventNotFoundError,
  NotEventOrganizerError,
} from '../../domain/competition.errors';

export type CreateTournamentResult = Result<
  string,
  CompetitionEventNotFoundError | NotEventOrganizerError
>;

@CommandHandler(CreateTournamentCommand)
export class CreateTournamentService
  implements ICommandHandler<CreateTournamentCommand, CreateTournamentResult>
{
  constructor(
    @Inject(TOURNAMENT_REPOSITORY) private readonly repo: TournamentRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateTournamentCommand): Promise<CreateTournamentResult> {
    // Cross-context authorization — ask the `event` context over the QueryBus (no module import).
    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: command.eventId, userId: command.actorId }),
    );
    if (!check.eventExists) return Err(new CompetitionEventNotFoundError());
    if (!check.isOrganizer) return Err(new NotEventOrganizerError());

    const config: TournamentConfig = {
      numGroups: command.numGroups ?? null,
      advancePerGroup: command.advancePerGroup ?? null,
      seedMethod: SeedMethod.MANUAL_ORDER,
    };

    const tournament = TournamentEntity.create(
      {
        eventId: command.eventId,
        createdBy: command.actorId,
        name: MultilingualText.create(command.nameVi, command.nameJa),
        format: command.format,
        config,
      },
      this.repo.nextId(),
      new Date(),
    );
    await this.repo.insert(tournament);
    return Ok(tournament.id);
  }
}
