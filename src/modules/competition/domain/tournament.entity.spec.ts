import { TournamentEntity } from './tournament.entity';
import { MultilingualText } from './value-objects/multilingual-text.value-object';
import {
  MatchStatus,
  SeedMethod,
  TournamentConfig,
  TournamentFormat,
  TournamentStage,
  TournamentStatus,
} from './competition.types';

const NOW = new Date('2026-07-02T00:00:00Z');

function idFactory(): () => string {
  let n = 0;
  return () => `id-${++n}`;
}

const baseConfig: TournamentConfig = {
  numGroups: null,
  advancePerGroup: null,
  seedMethod: SeedMethod.MANUAL_ORDER,
};

function makeTournament(
  format: TournamentFormat,
  config: TournamentConfig = baseConfig,
): TournamentEntity {
  return TournamentEntity.create(
    { eventId: 'event-1', createdBy: 'user-1', name: MultilingualText.create('Giải'), format, config },
    'tournament-1',
    NOW,
  );
}

function addCompetitors(t: TournamentEntity, count: number): void {
  for (let i = 1; i <= count; i++) {
    t.addCompetitor(`reg-${i}`, `Player ${i}`, `comp-${i}`, NOW).unwrap();
  }
}

/** Play every currently-SCHEDULED match, letting competitorA win, until none remain schedulable. */
function playAll(t: TournamentEntity): void {
  let guard = 0;
  while (guard++ < 1000) {
    const next = t.matches.find((m) => m.status === MatchStatus.SCHEDULED);
    if (!next) break;
    t.recordMatchResult(next.matchId, 2, 1, null, NOW).unwrap();
  }
}

describe('TournamentEntity — single elimination', () => {
  it('seeds a power-of-two bracket with no byes', () => {
    const t = makeTournament(TournamentFormat.SINGLE_ELIM);
    addCompetitors(t, 4);
    t.seed(idFactory(), NOW).unwrap();

    expect(t.status).toBe(TournamentStatus.SEEDED);
    expect(t.matches).toHaveLength(3); // 2 semis + 1 final
    const round1 = t.matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(2);
    expect(round1.every((m) => m.status === MatchStatus.SCHEDULED)).toBe(true);
    const final = t.matches.find((m) => m.round === 2)!;
    expect(final.status).toBe(MatchStatus.PENDING);
    expect(final.nextMatchId).toBeNull();
  });

  it('gives byes to top seeds when the count is not a power of two', () => {
    const t = makeTournament(TournamentFormat.SINGLE_ELIM);
    addCompetitors(t, 3); // size 4, 1 bye
    t.seed(idFactory(), NOW).unwrap();

    const byes = t.matches.filter((m) => m.status === MatchStatus.BYE);
    expect(byes).toHaveLength(1);
    // The bye must have advanced its competitor into the final.
    const final = t.matches.find((m) => m.nextMatchId === null)!;
    expect(final.competitorA !== null || final.competitorB !== null).toBe(true);
  });

  it('advances the winner and crowns a champion', () => {
    const t = makeTournament(TournamentFormat.SINGLE_ELIM);
    addCompetitors(t, 4);
    t.seed(idFactory(), NOW).unwrap();
    playAll(t);

    expect(t.matches.every((m) => m.status === MatchStatus.PLAYED || m.status === MatchStatus.BYE)).toBe(true);
    t.complete(NOW).unwrap();
    expect(t.status).toBe(TournamentStatus.COMPLETED);
    expect(t.champion()).not.toBeNull();
  });

  it('rejects a draw in an elimination match', () => {
    const t = makeTournament(TournamentFormat.SINGLE_ELIM);
    addCompetitors(t, 4);
    t.seed(idFactory(), NOW).unwrap();
    const m = t.matches.find((x) => x.status === MatchStatus.SCHEDULED)!;
    const res = t.recordMatchResult(m.matchId, 1, 1, null, NOW);
    expect(res.isErr()).toBe(true);
  });
});

describe('TournamentEntity — round robin', () => {
  it('schedules every pairing once', () => {
    const t = makeTournament(TournamentFormat.ROUND_ROBIN);
    addCompetitors(t, 4);
    t.seed(idFactory(), NOW).unwrap();
    expect(t.matches).toHaveLength(6); // 4*3/2
    expect(t.matches.every((m) => m.status === MatchStatus.SCHEDULED)).toBe(true);
  });

  it('allows draws and completes via standings', () => {
    const t = makeTournament(TournamentFormat.ROUND_ROBIN);
    addCompetitors(t, 3);
    t.seed(idFactory(), NOW).unwrap();
    const [m1] = t.matches;
    t.recordMatchResult(m1.matchId, 1, 1, null, NOW).unwrap(); // draw is fine
    playAll(t);
    t.complete(NOW).unwrap();
    expect(t.champion()).not.toBeNull();
  });
});

describe('TournamentEntity — group → knockout', () => {
  const gkConfig: TournamentConfig = {
    numGroups: 2,
    advancePerGroup: 2,
    seedMethod: SeedMethod.MANUAL_ORDER,
  };

  it('seeds groups, then advances to a knockout bracket', () => {
    const gen = idFactory(); // one generator so group + knockout match ids never collide
    const t = makeTournament(TournamentFormat.GROUP_KNOCKOUT, gkConfig);
    addCompetitors(t, 8);
    t.seed(gen, NOW).unwrap();
    expect(t.stage).toBe(TournamentStage.GROUP);
    // 2 groups of 4 → each round-robin has 6 matches → 12 group matches.
    expect(t.matches.filter((m) => m.stage === TournamentStage.GROUP)).toHaveLength(12);

    playAll(t); // play all group matches
    t.advanceToKnockout(gen, NOW).unwrap();
    expect(t.stage).toBe(TournamentStage.KNOCKOUT);
    // 4 advancing → single-elim: 2 semis + 1 final.
    expect(t.matches.filter((m) => m.stage === TournamentStage.KNOCKOUT)).toHaveLength(3);

    playAll(t);
    t.complete(NOW).unwrap();
    expect(t.champion()).not.toBeNull();
  });

  it('refuses to advance before all group matches are played', () => {
    const t = makeTournament(TournamentFormat.GROUP_KNOCKOUT, gkConfig);
    addCompetitors(t, 8);
    t.seed(idFactory(), NOW).unwrap();
    expect(t.advanceToKnockout(idFactory(), NOW).isErr()).toBe(true);
  });
});

describe('TournamentEntity — guards', () => {
  it('cannot add a competitor after seeding', () => {
    const t = makeTournament(TournamentFormat.SINGLE_ELIM);
    addCompetitors(t, 2);
    t.seed(idFactory(), NOW).unwrap();
    expect(t.addCompetitor('reg-x', 'X', 'comp-x', NOW).isErr()).toBe(true);
  });

  it('rejects duplicate registrations', () => {
    const t = makeTournament(TournamentFormat.SINGLE_ELIM);
    t.addCompetitor('reg-1', 'A', 'comp-1', NOW).unwrap();
    expect(t.addCompetitor('reg-1', 'A again', 'comp-2', NOW).isErr()).toBe(true);
  });

  it('cannot seed with fewer than two competitors', () => {
    const t = makeTournament(TournamentFormat.SINGLE_ELIM);
    addCompetitors(t, 1);
    expect(t.seed(idFactory(), NOW).isErr()).toBe(true);
  });
});
