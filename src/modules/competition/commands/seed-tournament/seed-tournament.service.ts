import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { SeedTournamentCommand } from './seed-tournament.command';
import {
  TOURNAMENT_REPOSITORY,
  TournamentRepositoryPort,
} from '../../application/ports/tournament.repository.port';
import {
  InvalidSeedingError,
  InvalidTournamentStateError,
  NotEventOrganizerError,
  TournamentNotFoundError,
} from '../../domain/competition.errors';

export type SeedTournamentResult = Result<
  string,
  | TournamentNotFoundError
  | NotEventOrganizerError
  | InvalidTournamentStateError
  | InvalidSeedingError
>;

@CommandHandler(SeedTournamentCommand)
export class SeedTournamentService
  implements ICommandHandler<SeedTournamentCommand, SeedTournamentResult>
{
  constructor(
    @Inject(TOURNAMENT_REPOSITORY) private readonly repo: TournamentRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: SeedTournamentCommand): Promise<SeedTournamentResult> {
    const tournament = await this.repo.findOneById(command.tournamentId);
    if (!tournament) return Err(new TournamentNotFoundError());

    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: tournament.eventId, userId: command.actorId }),
    );
    if (!check.isOrganizer) return Err(new NotEventOrganizerError());

    // Infrastructure supplies match ids; the domain never calls crypto.
    const result = tournament.seed(() => this.repo.nextId(), new Date());
    if (result.isErr()) return Err(result.unwrapErr());

    await this.repo.save(tournament);
    return Ok(tournament.id);
  }
}
