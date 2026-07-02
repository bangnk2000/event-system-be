import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@libs/exceptions';
import { GetTournamentBracketQuery } from './get-tournament-bracket.query';
import { TournamentBracketDto } from './get-tournament-bracket.response.dto';
import { TournamentOrmEntity } from '../../database/tournament.persistence.model';

/** Read side: the full bracket/schedule (competitors + matches) for display, straight from the DB. */
@QueryHandler(GetTournamentBracketQuery)
export class GetTournamentBracketQueryHandler
  implements IQueryHandler<GetTournamentBracketQuery, TournamentBracketDto>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetTournamentBracketQuery): Promise<TournamentBracketDto> {
    const row = await this.dataSource
      .getRepository(TournamentOrmEntity)
      .findOne({ where: { id: query.tournamentId } });
    if (!row) throw new NotFoundException('Tournament not found');

    return {
      tournamentId: row.id,
      eventId: row.eventId,
      name: row.nameVi,
      format: row.format,
      status: row.status,
      stage: row.stage,
      competitors: row.competitors.map((c) => ({
        competitorId: c.competitorId,
        seed: c.seed,
        displayName: c.displayName,
        groupLabel: c.groupLabel,
      })),
      matches: row.matches.map((m) => ({
        matchId: m.matchId,
        round: m.round,
        groupLabel: m.groupLabel,
        stage: m.stage,
        competitorA: m.competitorA,
        competitorB: m.competitorB,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        winner: m.winner,
        status: m.status,
        nextMatchId: m.nextMatchId,
        detail: m.detail,
      })),
    };
  }
}
