import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import { AdvanceToKnockoutCommand } from './advance-to-knockout.command';
import {
  TOURNAMENT_REPOSITORY,
  TournamentRepositoryPort,
} from '../../application/ports/tournament.repository.port';
import {
  InvalidTournamentStateError,
  KnockoutNotReadyError,
  NotEventOrganizerError,
  TournamentNotFoundError,
} from '../../domain/competition.errors';

export type AdvanceToKnockoutResult = Result<
  string,
  | TournamentNotFoundError
  | NotEventOrganizerError
  | InvalidTournamentStateError
  | KnockoutNotReadyError
>;

@CommandHandler(AdvanceToKnockoutCommand)
export class AdvanceToKnockoutService
  implements ICommandHandler<AdvanceToKnockoutCommand, AdvanceToKnockoutResult>
{
  constructor(
    @Inject(TOURNAMENT_REPOSITORY) private readonly repo: TournamentRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: AdvanceToKnockoutCommand): Promise<AdvanceToKnockoutResult> {
    const tournament = await this.repo.findOneById(command.tournamentId);
    if (!tournament) return Err(new TournamentNotFoundError());

    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: tournament.eventId, userId: command.actorId }),
    );
    if (!check.isOrganizer) return Err(new NotEventOrganizerError());

    const result = tournament.advanceToKnockout(() => this.repo.nextId(), new Date());
    if (result.isErr()) return Err(result.unwrapErr());

    await this.repo.save(tournament);
    return Ok(tournament.id);
  }
}
