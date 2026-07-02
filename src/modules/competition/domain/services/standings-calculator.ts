import { Competitor } from '../competitor';
import { Match } from '../match';
import { MatchStatus } from '../competition.types';

export interface Standing {
  competitorId: string;
  displayName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  scoreFor: number;
  scoreAgainst: number;
  diff: number;
  points: number;
}

const WIN_POINTS = 3;
const DRAW_POINTS = 1;

/**
 * Standings table from PLAYED matches. Points = win×3 + draw×1.
 * Ranked by points → goal difference → scoreFor. (Head-to-head tiebreak omitted at MVP.)
 * `matches` should be pre-filtered to the relevant scope (e.g. a single group's matches).
 */
export function computeStandings(competitors: Competitor[], matches: Match[]): Standing[] {
  const table = new Map<string, Standing>();
  for (const c of competitors) {
    table.set(c.competitorId, {
      competitorId: c.competitorId,
      displayName: c.displayName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      scoreFor: 0,
      scoreAgainst: 0,
      diff: 0,
      points: 0,
    });
  }

  const played = matches.filter(
    (m) => m.status === MatchStatus.PLAYED && m.competitorA !== null && m.competitorB !== null,
  );
  for (const m of played) {
    const a = table.get(m.competitorA as string);
    const b = table.get(m.competitorB as string);
    if (!a || !b) continue;
    const sa = m.scoreA ?? 0;
    const sb = m.scoreB ?? 0;
    a.played++;
    b.played++;
    a.scoreFor += sa;
    a.scoreAgainst += sb;
    b.scoreFor += sb;
    b.scoreAgainst += sa;
    if (sa > sb) {
      a.won++;
      b.lost++;
      a.points += WIN_POINTS;
    } else if (sa < sb) {
      b.won++;
      a.lost++;
      b.points += WIN_POINTS;
    } else {
      a.drawn++;
      b.drawn++;
      a.points += DRAW_POINTS;
      b.points += DRAW_POINTS;
    }
  }

  for (const s of table.values()) s.diff = s.scoreFor - s.scoreAgainst;

  return [...table.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.scoreFor - a.scoreFor;
  });
}
