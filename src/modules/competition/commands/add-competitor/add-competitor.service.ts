import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Err, Ok, Result } from 'oxide.ts';
import {
  IsEventOrganizerQuery,
  IsEventOrganizerResult,
} from '@libs/contracts/event/is-event-organizer.query';
import {
  GetEventRegistrationsQuery,
  GetEventRegistrationsResult,
} from '@libs/contracts/participation/get-event-registrations.query';
import { AddCompetitorCommand } from './add-competitor.command';
import {
  TOURNAMENT_REPOSITORY,
  TournamentRepositoryPort,
} from '../../application/ports/tournament.repository.port';
import {
  DuplicateCompetitorError,
  InvalidRegistrationError,
  InvalidTournamentStateError,
  NotEventOrganizerError,
  TournamentNotFoundError,
} from '../../domain/competition.errors';

export type AddCompetitorResult = Result<
  string,
  | TournamentNotFoundError
  | NotEventOrganizerError
  | InvalidRegistrationError
  | InvalidTournamentStateError
  | DuplicateCompetitorError
>;

@CommandHandler(AddCompetitorCommand)
export class AddCompetitorService
  implements ICommandHandler<AddCompetitorCommand, AddCompetitorResult>
{
  constructor(
    @Inject(TOURNAMENT_REPOSITORY) private readonly repo: TournamentRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: AddCompetitorCommand): Promise<AddCompetitorResult> {
    const tournament = await this.repo.findOneById(command.tournamentId);
    if (!tournament) return Err(new TournamentNotFoundError());

    const check: IsEventOrganizerResult = await this.queryBus.execute(
      new IsEventOrganizerQuery({ eventId: tournament.eventId, userId: command.actorId }),
    );
    if (!check.isOrganizer) return Err(new NotEventOrganizerError());

    // Promote a registration into a competitor — snapshot its display name (no re-entry of identity).
    const registrations: GetEventRegistrationsResult = await this.queryBus.execute(
      new GetEventRegistrationsQuery({ eventId: tournament.eventId }),
    );
    const registration = registrations.find((r) => r.registrationId === command.registrationId);
    if (!registration) return Err(new InvalidRegistrationError());

    const result = tournament.addCompetitor(
      registration.registrationId,
      registration.displayName,
      this.repo.nextId(),
      new Date(),
    );
    if (result.isErr()) return Err(result.unwrapErr());

    await this.repo.save(tournament);
    return Ok(result.unwrap());
  }
}
