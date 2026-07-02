import request from 'supertest';
import { cleanDatabase, closeTestApp, createTestApp, TestContext } from './setup/test-app';

const ORG = '11111111-1111-1111-1111-111111111111';
const OUTSIDER = '99999999-9999-9999-9999-999999999999';
const MISSING_EVENT = '00000000-0000-0000-0000-000000000000';

const USERS = [
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000005',
  'a0000000-0000-4000-8000-000000000006',
  'a0000000-0000-4000-8000-000000000007',
  'a0000000-0000-4000-8000-000000000008',
];

interface MatchView {
  matchId: string;
  status: string;
  competitorA: string | null;
  competitorB: string | null;
}

describe('Competition API (e2e)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });
  afterAll(async () => {
    await closeTestApp(ctx);
  });

  /** Event walked to REGISTRATION_OPEN with `n` individual registrants; returns eventId + registrationIds. */
  const createEventWithRegistrants = async (
    n: number,
  ): Promise<{ eventId: string; registrationIds: string[] }> => {
    const res = await http()
      .post('/v1/events')
      .set('x-user-id', ORG)
      .send({
        titleVi: 'Giải thể thao',
        type: 'TEAM_BUILDING',
        startAt: '2026-07-10T02:00:00.000Z',
        endAt: '2026-07-10T04:00:00.000Z',
        registrationMode: 'INDIVIDUAL',
      });
    const eventId = res.body.id as string;
    await http().post(`/v1/events/${eventId}/publish`).set('x-user-id', ORG);
    await http().post(`/v1/events/${eventId}/open-registration`).set('x-user-id', ORG);

    const registrationIds: string[] = [];
    for (let i = 0; i < n; i++) {
      const reg = await http()
        .post(`/v1/events/${eventId}/registrations`)
        .set('x-user-id', USERS[i])
        .send({ mode: 'INDIVIDUAL' });
      registrationIds.push(reg.body.id as string);
    }
    return { eventId, registrationIds };
  };

  const createTournament = async (eventId: string, body: object): Promise<string> =>
    (await http().post(`/v1/events/${eventId}/tournaments`).set('x-user-id', ORG).send(body)).body
      .id as string;

  const addCompetitors = async (tournamentId: string, registrationIds: string[]): Promise<void> => {
    for (const registrationId of registrationIds) {
      await http()
        .post(`/v1/tournaments/${tournamentId}/competitors`)
        .set('x-user-id', ORG)
        .send({ registrationId });
    }
  };

  /** Play every currently-SCHEDULED match (A wins) until none remain schedulable. */
  const playAll = async (tournamentId: string): Promise<void> => {
    for (let guard = 0; guard < 100; guard++) {
      const bracket = await http().get(`/v1/tournaments/${tournamentId}`);
      const next = (bracket.body.matches as MatchView[]).find((m) => m.status === 'SCHEDULED');
      if (!next) return;
      const res = await http()
        .post(`/v1/tournaments/${tournamentId}/matches/${next.matchId}/result`)
        .set('x-user-id', ORG)
        .send({ scoreA: 2, scoreB: 1 });
      expect(res.status).toBe(201);
    }
  };

  it('authorizes tournament creation via the cross-context organizer check', async () => {
    const { eventId } = await createEventWithRegistrants(2);
    const body = { nameVi: 'Giải cầu lông', format: 'SINGLE_ELIM' };

    expect(
      (await http().post(`/v1/events/${eventId}/tournaments`).set('x-user-id', OUTSIDER).send(body))
        .status,
    ).toBe(403);
    expect(
      (await http().post(`/v1/events/${MISSING_EVENT}/tournaments`).set('x-user-id', ORG).send(body))
        .status,
    ).toBe(404);
    expect(
      (await http().post(`/v1/events/${eventId}/tournaments`).set('x-user-id', ORG).send(body)).status,
    ).toBe(201);
  });

  it('runs a single-elimination tournament end to end', async () => {
    const { eventId, registrationIds } = await createEventWithRegistrants(4);
    const tournamentId = await createTournament(eventId, {
      nameVi: 'Giải loại trực tiếp',
      format: 'SINGLE_ELIM',
    });
    await addCompetitors(tournamentId, registrationIds);

    expect((await http().post(`/v1/tournaments/${tournamentId}/seed`).set('x-user-id', ORG)).status).toBe(201);

    const seeded = await http().get(`/v1/tournaments/${tournamentId}`);
    expect(seeded.body.status).toBe('SEEDED');
    expect(seeded.body.matches).toHaveLength(3); // 2 semis + final

    await playAll(tournamentId);
    expect((await http().post(`/v1/tournaments/${tournamentId}/complete`).set('x-user-id', ORG)).status).toBe(201);

    const done = await http().get(`/v1/tournaments/${tournamentId}`);
    expect(done.body.status).toBe('COMPLETED');
    const finalMatch = (
      done.body.matches as { nextMatchId: string | null; winner: string | null }[]
    ).find((m) => m.nextMatchId === null)!;
    expect(finalMatch.winner).not.toBeNull();
  });

  it('rejects adding a competitor after seeding (409) and an invalid registration (400)', async () => {
    const { eventId, registrationIds } = await createEventWithRegistrants(3);
    const tournamentId = await createTournament(eventId, { nameVi: 'RR', format: 'ROUND_ROBIN' });

    expect(
      (
        await http()
          .post(`/v1/tournaments/${tournamentId}/competitors`)
          .set('x-user-id', ORG)
          .send({ registrationId: MISSING_EVENT })
      ).status,
    ).toBe(400);

    await addCompetitors(tournamentId, registrationIds);
    await http().post(`/v1/tournaments/${tournamentId}/seed`).set('x-user-id', ORG);

    expect(
      (
        await http()
          .post(`/v1/tournaments/${tournamentId}/competitors`)
          .set('x-user-id', ORG)
          .send({ registrationId: registrationIds[0] })
      ).status,
    ).toBe(409);
  });

  it('computes round-robin standings', async () => {
    const { eventId, registrationIds } = await createEventWithRegistrants(4);
    const tournamentId = await createTournament(eventId, { nameVi: 'Vòng tròn', format: 'ROUND_ROBIN' });
    await addCompetitors(tournamentId, registrationIds);
    await http().post(`/v1/tournaments/${tournamentId}/seed`).set('x-user-id', ORG);

    const seeded = await http().get(`/v1/tournaments/${tournamentId}`);
    expect(seeded.body.matches).toHaveLength(6); // 4*3/2

    await playAll(tournamentId);
    const standings = await http().get(`/v1/tournaments/${tournamentId}/standings`);
    expect(standings.status).toBe(200);
    expect(standings.body.groups).toHaveLength(1);
    expect(standings.body.groups[0].rows).toHaveLength(4);
    // Every competitor played 3 matches.
    expect(standings.body.groups[0].rows.every((r: { played: number }) => r.played === 3)).toBe(true);
  });

  it('runs a group→knockout tournament: group stage then knockout', async () => {
    const { eventId, registrationIds } = await createEventWithRegistrants(8);
    const tournamentId = await createTournament(eventId, {
      nameVi: 'Bảng + loại',
      format: 'GROUP_KNOCKOUT',
      numGroups: 2,
      advancePerGroup: 2,
    });
    await addCompetitors(tournamentId, registrationIds);
    await http().post(`/v1/tournaments/${tournamentId}/seed`).set('x-user-id', ORG);

    const grouped = await http().get(`/v1/tournaments/${tournamentId}`);
    expect(grouped.body.stage).toBe('GROUP');
    expect((grouped.body.matches as { stage: string }[]).filter((m) => m.stage === 'GROUP')).toHaveLength(12);

    // Cannot advance before the group stage is finished.
    expect((await http().post(`/v1/tournaments/${tournamentId}/advance-knockout`).set('x-user-id', ORG)).status).toBe(409);

    await playAll(tournamentId); // finish the group stage
    expect((await http().post(`/v1/tournaments/${tournamentId}/advance-knockout`).set('x-user-id', ORG)).status).toBe(201);

    const knockout = await http().get(`/v1/tournaments/${tournamentId}`);
    expect(knockout.body.stage).toBe('KNOCKOUT');
    expect((knockout.body.matches as { stage: string }[]).filter((m) => m.stage === 'KNOCKOUT')).toHaveLength(3);

    await playAll(tournamentId);
    expect((await http().post(`/v1/tournaments/${tournamentId}/complete`).set('x-user-id', ORG)).status).toBe(201);
  });
});
