import { Match } from '../match';
import { MatchStatus, TournamentStage } from '../competition.types';

/**
 * Round-robin schedule via the circle method — everyone plays everyone once.
 * Odd counts get a phantom "bye" each round (that pairing is dropped). All matches are SCHEDULED
 * immediately (no dependency between them). Ranking is derived later via computeStandings().
 */
export function generateRoundRobin(
  competitorIds: string[],
  newId: () => string,
  opts: { groupLabel?: string | null; stage?: TournamentStage | null; roundOffset?: number } = {},
): Match[] {
  const groupLabel = opts.groupLabel ?? null;
  const stage = opts.stage ?? null;
  const roundOffset = opts.roundOffset ?? 0;

  const players: (string | null)[] = [...competitorIds];
  if (players.length % 2 === 1) players.push(null);
  const n = players.length;
  const rounds = n - 1;
  const half = n / 2;
  const arr = [...players];
  const matches: Match[] = [];

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== null && b !== null) {
        matches.push(
          new Match({
            matchId: newId(),
            round: roundOffset + r + 1,
            slotInRound: i,
            groupLabel,
            stage,
            competitorA: a,
            competitorB: b,
            scoreA: null,
            scoreB: null,
            winner: null,
            status: MatchStatus.SCHEDULED,
            nextMatchId: null,
            nextSlot: null,
            detail: null,
          }),
        );
      }
    }
    // Rotate, keeping the first element fixed (standard circle method).
    const fixed = arr[0];
    const rest = arr.slice(1);
    const last = rest.pop() as string | null;
    rest.unshift(last);
    arr.splice(0, arr.length, fixed, ...rest);
  }
  return matches;
}
