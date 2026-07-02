import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TOURNAMENT_REPOSITORY } from './application/ports/tournament.repository.port';
import { CreateTournamentService } from './commands/create-tournament/create-tournament.service';
import { CreateTournamentHttpController } from './commands/create-tournament/create-tournament.http.controller';
import { AddCompetitorService } from './commands/add-competitor/add-competitor.service';
import { AddCompetitorHttpController } from './commands/add-competitor/add-competitor.http.controller';
import { RemoveCompetitorService } from './commands/remove-competitor/remove-competitor.service';
import { RemoveCompetitorHttpController } from './commands/remove-competitor/remove-competitor.http.controller';
import { SeedTournamentService } from './commands/seed-tournament/seed-tournament.service';
import { SeedTournamentHttpController } from './commands/seed-tournament/seed-tournament.http.controller';
import { RecordMatchResultService } from './commands/record-match-result/record-match-result.service';
import { RecordMatchResultHttpController } from './commands/record-match-result/record-match-result.http.controller';
import { AdvanceToKnockoutService } from './commands/advance-to-knockout/advance-to-knockout.service';
import { AdvanceToKnockoutHttpController } from './commands/advance-to-knockout/advance-to-knockout.http.controller';
import { CompleteTournamentService } from './commands/complete-tournament/complete-tournament.service';
import { CompleteTournamentHttpController } from './commands/complete-tournament/complete-tournament.http.controller';
import { GetTournamentBracketQueryHandler } from './queries/get-tournament-bracket/get-tournament-bracket.query-handler';
import { GetTournamentBracketHttpController } from './queries/get-tournament-bracket/get-tournament-bracket.http.controller';
import { GetTournamentStandingsQueryHandler } from './queries/get-tournament-standings/get-tournament-standings.query-handler';
import { GetTournamentStandingsHttpController } from './queries/get-tournament-standings/get-tournament-standings.http.controller';
import { ListEventTournamentsQueryHandler } from './queries/list-event-tournaments/list-event-tournaments.query-handler';
import { ListEventTournamentsHttpController } from './queries/list-event-tournaments/list-event-tournaments.http.controller';
import { TournamentRepository } from './database/tournament.repository';
import { TournamentMapper } from './database/tournament.mapper';

@Module({
  imports: [CqrsModule],
  controllers: [
    CreateTournamentHttpController,
    AddCompetitorHttpController,
    RemoveCompetitorHttpController,
    SeedTournamentHttpController,
    RecordMatchResultHttpController,
    AdvanceToKnockoutHttpController,
    CompleteTournamentHttpController,
    GetTournamentBracketHttpController,
    GetTournamentStandingsHttpController,
    ListEventTournamentsHttpController,
  ],
  providers: [
    TournamentMapper,
    CreateTournamentService,
    AddCompetitorService,
    RemoveCompetitorService,
    SeedTournamentService,
    RecordMatchResultService,
    AdvanceToKnockoutService,
    CompleteTournamentService,
    GetTournamentBracketQueryHandler,
    GetTournamentStandingsQueryHandler,
    ListEventTournamentsQueryHandler,
    { provide: TOURNAMENT_REPOSITORY, useClass: TournamentRepository },
  ],
})
export class CompetitionModule {}
