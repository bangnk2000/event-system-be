import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { CompleteTournamentCommand } from './complete-tournament.command';
import {
  TOURNAMENT_REPOSITORY,
  TournamentRepositoryPort,
} from '../../application/ports/tournament.repository.port';
import {
  InvalidTournamentStateError,
  NotEventOrganizerError,
  TournamentNotFoundError,
} from '../../domain/competition.errors';

export type CompleteTournamentResult = Result<
  string,
  TournamentNotFoundError | NotEventOrganizerError | InvalidTournamentStateError
>;

@CommandHandler(CompleteTournamentCommand)
export class CompleteTournamentService
  implements ICommandHandler<CompleteTournamentCommand, CompleteTournamentResult>
{
  constructor(
    @Inject(TOURNAMENT_REPOSITORY) private readonly repo: TournamentRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CompleteTournamentCommand): Promise<CompleteTournamentResult> {
    const tournament = await this.repo.findOneById(command.tournamentId);
    if (!tournament) return Err(new TournamentNotFoundError());

    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: tournament.eventId, userId: command.actorId }),
    );
    if (!check.isOrganizer) return Err(new NotEventOrganizerError());

    const result = tournament.complete(new Date());
    if (result.isErr()) return Err(result.unwrapErr());

    await this.repo.save(tournament);
    return Ok(tournament.id);
  }
}
