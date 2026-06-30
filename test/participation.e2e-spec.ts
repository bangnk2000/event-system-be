import request from 'supertest';
import { cleanDatabase, closeTestApp, createTestApp, TestContext } from './setup/test-app';

const ORG = '11111111-1111-1111-1111-111111111111';
const USER_A = '33333333-3333-3333-3333-333333333333';
const USER_B = '44444444-4444-4444-4444-444444444444';

describe('Participation API (e2e)', () => {
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

  const createEvent = async (): Promise<string> => {
    const res = await http()
      .post('/v1/events')
      .set('x-user-id', ORG)
      .send({
        titleVi: 'Giải cầu lông',
        type: 'TEAM_BUILDING',
        startAt: '2026-07-10T02:00:00.000Z',
        endAt: '2026-07-10T04:00:00.000Z',
        registrationMode: 'BOTH',
      });
    return res.body.id as string;
  };

  it('registers a participant once and rejects a duplicate (409)', async () => {
    const eventId = await createEvent();
    const first = await http()
      .post(`/v1/events/${eventId}/registrations`)
      .set('x-user-id', USER_A)
      .send({ mode: 'INDIVIDUAL' });
    expect(first.status).toBe(201);

    const dup = await http()
      .post(`/v1/events/${eventId}/registrations`)
      .set('x-user-id', USER_A)
      .send({ mode: 'INDIVIDUAL' });
    expect(dup.status).toBe(409);
  });

  it('rejects a team registration without a team name (400)', async () => {
    const eventId = await createEvent();
    const res = await http()
      .post(`/v1/events/${eventId}/registrations`)
      .set('x-user-id', USER_B)
      .send({ mode: 'TEAM' });
    expect(res.status).toBe(400);
  });

  it('lists registrations for an event', async () => {
    const eventId = await createEvent();
    await http()
      .post(`/v1/events/${eventId}/registrations`)
      .set('x-user-id', USER_A)
      .send({ mode: 'INDIVIDUAL' });
    await http()
      .post(`/v1/events/${eventId}/registrations`)
      .set('x-user-id', USER_B)
      .send({ mode: 'TEAM', teamName: 'Team Alpha' });

    const res = await http().get(`/v1/events/${eventId}/registrations`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('checks in once, rejects a second check-in (409), and guards cancel by ownership', async () => {
    const eventId = await createEvent();
    const reg = await http()
      .post(`/v1/events/${eventId}/registrations`)
      .set('x-user-id', USER_A)
      .send({ mode: 'INDIVIDUAL' });
    const regId = reg.body.id as string;

    expect((await http().post(`/v1/registrations/${regId}/check-in`).set('x-user-id', ORG)).status).toBe(201);
    expect((await http().post(`/v1/registrations/${regId}/check-in`).set('x-user-id', ORG)).status).toBe(409);

    // only the registrant can cancel
    expect((await http().post(`/v1/registrations/${regId}/cancel`).set('x-user-id', USER_B)).status).toBe(403);
    expect((await http().post(`/v1/registrations/${regId}/cancel`).set('x-user-id', USER_A)).status).toBe(201);

    // cannot check in a cancelled registration
    expect((await http().post(`/v1/registrations/${regId}/check-in`).set('x-user-id', ORG)).status).toBe(409);
  });
});
