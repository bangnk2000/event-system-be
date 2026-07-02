import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { RemoveCompetitorCommand } from './remove-competitor.command';
import {
  TOURNAMENT_REPOSITORY,
  TournamentRepositoryPort,
} from '../../application/ports/tournament.repository.port';
import {
  CompetitorNotFoundError,
  InvalidTournamentStateError,
  NotEventOrganizerError,
  TournamentNotFoundError,
} from '../../domain/competition.errors';

export type RemoveCompetitorResult = Result<
  string,
  | TournamentNotFoundError
  | NotEventOrganizerError
  | InvalidTournamentStateError
  | CompetitorNotFoundError
>;

@CommandHandler(RemoveCompetitorCommand)
export class RemoveCompetitorService
  implements ICommandHandler<RemoveCompetitorCommand, RemoveCompetitorResult>
{
  constructor(
    @Inject(TOURNAMENT_REPOSITORY) private readonly repo: TournamentRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: RemoveCompetitorCommand): Promise<RemoveCompetitorResult> {
    const tournament = await this.repo.findOneById(command.tournamentId);
    if (!tournament) return Err(new TournamentNotFoundError());

    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: tournament.eventId, userId: command.actorId }),
    );
    if (!check.isOrganizer) return Err(new NotEventOrganizerError());

    const result = tournament.removeCompetitor(command.competitorId, new Date());
    if (result.isErr()) return Err(result.unwrapErr());

    await this.repo.save(tournament);
    return Ok(tournament.id);
  }
}
