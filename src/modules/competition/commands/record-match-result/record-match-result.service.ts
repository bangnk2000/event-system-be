import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { RecordMatchResultCommand } from './record-match-result.command';
import {
  TOURNAMENT_REPOSITORY,
  TournamentRepositoryPort,
} from '../../application/ports/tournament.repository.port';
import {
  InvalidScoreError,
  InvalidTournamentStateError,
  MatchNotFoundError,
  MatchNotPlayableError,
  NotEventOrganizerError,
  TournamentNotFoundError,
} from '../../domain/competition.errors';

export type RecordMatchResultResult = Result<
  string,
  | TournamentNotFoundError
  | NotEventOrganizerError
  | InvalidTournamentStateError
  | MatchNotFoundError
  | MatchNotPlayableError
  | InvalidScoreError
>;

@CommandHandler(RecordMatchResultCommand)
export class RecordMatchResultService
  implements ICommandHandler<RecordMatchResultCommand, RecordMatchResultResult>
{
  constructor(
    @Inject(TOURNAMENT_REPOSITORY) private readonly repo: TournamentRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: RecordMatchResultCommand): Promise<RecordMatchResultResult> {
    const tournament = await this.repo.findOneById(command.tournamentId);
    if (!tournament) return Err(new TournamentNotFoundError());

    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: tournament.eventId, userId: command.actorId }),
    );
    if (!check.isOrganizer) return Err(new NotEventOrganizerError());

    const result = tournament.recordMatchResult(
      command.matchId,
      command.scoreA,
      command.scoreB,
      command.detail ?? null,
      new Date(),
    );
    if (result.isErr()) return Err(result.unwrapErr());

    await this.repo.save(tournament);
    return Ok(tournament.id);
  }
}
