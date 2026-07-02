import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@libs/exceptions';
import { GetTournamentStandingsQuery } from './get-tournament-standings.query';
import { StandingGroupDto, TournamentStandingsDto } from './get-tournament-standings.response.dto';
import { TournamentOrmEntity } from '../../database/tournament.persistence.model';
import { Competitor } from '../../domain/competitor';
import { Match } from '../../domain/match';
import { computeStandings } from '../../domain/services/standings-calculator';
import { TournamentFormat, TournamentStage } from '../../domain/competition.types';

/** Read side: standings computed from recorded scores (per group for group→knockout). */
@QueryHandler(GetTournamentStandingsQuery)
export class GetTournamentStandingsQueryHandler
  implements IQueryHandler<GetTournamentStandingsQuery, TournamentStandingsDto>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetTournamentStandingsQuery): Promise<TournamentStandingsDto> {
    const row = await this.dataSource
      .getRepository(TournamentOrmEntity)
      .findOne({ where: { id: query.tournamentId } });
    if (!row) throw new NotFoundException('Tournament not found');

    const competitors = row.competitors.map(
      (c) => new Competitor(c.competitorId, c.registrationId, c.seed, c.displayName, c.groupLabel),
    );
    const matches = row.matches.map((m) => new Match({ ...m }));

    const groups: StandingGroupDto[] = [];
    if (row.format === TournamentFormat.GROUP_KNOCKOUT) {
      const labels = [...new Set(competitors.map((c) => c.groupLabel).filter((l): l is string => l !== null))].sort();
      for (const label of labels) {
        const groupCompetitors = competitors.filter((c) => c.groupLabel === label);
        const groupMatches = matches.filter(
          (m) => m.stage === TournamentStage.GROUP && m.groupLabel === label,
        );
        groups.push({ groupLabel: label, rows: computeStandings(groupCompetitors, groupMatches) });
      }
    } else {
      groups.push({ groupLabel: null, rows: computeStandings(competitors, matches) });
    }

    return { tournamentId: row.id, format: row.format, groups };
  }
}
