import { Match } from '../match';
import { MatchStatus, TournamentStage } from '../competition.types';

export interface Entrant {
  competitorId: string;
  /** 1-based seed rank within this bracket (1 = strongest). */
  seed: number;
}

/**
 * Standard bracket seed order for a bracket of `size` (a power of two): returns seed numbers
 * (1-based) in bracket-position order so seed 1 and seed 2 land in opposite halves.
 */
export function bracketSeedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const sum = order.length * 2 + 1;
    const next: number[] = [];
    for (const s of order) {
      next.push(s);
      next.push(sum - s);
    }
    order = next;
  }
  return order;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Single-elimination bracket. Byes (`size - N`) go to the top seeds. Returns all matches across all
 * rounds, linked via nextMatchId; round-1 byes are pre-resolved (present competitor auto-advanced).
 * With `size` the smallest power of two ≥ N, byes < half, so only round 1 can contain byes.
 */
export function generateSingleElim(
  entrants: Entrant[],
  newId: () => string,
  stage: TournamentStage | null = null,
): Match[] {
  const sorted = [...entrants].sort((a, b) => a.seed - b.seed);
  const n = sorted.length;
  const size = nextPowerOfTwo(n);
  const rounds = Math.log2(size);
  const bySeedRank = new Map<number, Entrant>();
  sorted.forEach((e, i) => bySeedRank.set(i + 1, e));

  const byRound: Match[][] = [];
  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r;
    const arr: Match[] = [];
    for (let j = 0; j < count; j++) {
      arr.push(
        new Match({
          matchId: newId(),
          round: r,
          slotInRound: j,
          groupLabel: null,
          stage,
          competitorA: null,
          competitorB: null,
          scoreA: null,
          scoreB: null,
          winner: null,
          status: MatchStatus.PENDING,
          nextMatchId: null,
          nextSlot: null,
          detail: null,
        }),
      );
    }
    byRound.push(arr);
  }

  // Link each match to its parent in the next round.
  for (let r = 0; r < rounds - 1; r++) {
    byRound[r].forEach((m, j) => {
      const parent = byRound[r + 1][Math.floor(j / 2)];
      m.nextMatchId = parent.matchId;
      m.nextSlot = j % 2 === 0 ? 'A' : 'B';
    });
  }

  // Assign round-1 competitors by standard seed order (a seed rank > N means a bye).
  const order = bracketSeedOrder(size);
  const round1 = byRound[0];
  round1.forEach((m, j) => {
    m.competitorA = bySeedRank.get(order[2 * j])?.competitorId ?? null;
    m.competitorB = bySeedRank.get(order[2 * j + 1])?.competitorId ?? null;
  });

  // Resolve round-1 byes and set statuses.
  const all = byRound.flat();
  for (const m of round1) {
    const aEmpty = m.competitorA === null;
    const bEmpty = m.competitorB === null;
    if (aEmpty && bEmpty) continue;
    if (aEmpty !== bEmpty) {
      m.winner = (m.competitorA ?? m.competitorB) as string;
      m.status = MatchStatus.BYE;
      if (m.nextMatchId && m.nextSlot) {
        const parent = all.find((x) => x.matchId === m.nextMatchId);
        parent?.fillSlot(m.nextSlot, m.winner);
      }
    } else {
      m.status = MatchStatus.SCHEDULED;
    }
  }
  // A later-round match that received both competitors from adjacent byes is now playable.
  for (let r = 1; r < byRound.length; r++) {
    for (const m of byRound[r]) {
      if (m.status === MatchStatus.PENDING && m.hasBothCompetitors()) {
        m.status = MatchStatus.SCHEDULED;
      }
    }
  }

  return all;
}
