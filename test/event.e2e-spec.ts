import request from 'supertest';
import { cleanDatabase, closeTestApp, createTestApp, TestContext } from './setup/test-app';

const OWNER = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

const validEvent = {
  titleVi: 'Họp toàn công ty',
  titleJa: '全社ミーティング',
  type: 'INTERNAL_MEETING',
  startAt: '2026-07-10T02:00:00.000Z',
  endAt: '2026-07-10T04:00:00.000Z',
  registrationMode: 'INDIVIDUAL',
};

describe('Event API (e2e)', () => {
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

  const createEvent = async (userId = OWNER): Promise<string> => {
    const res = await http().post('/v1/events').set('x-user-id', userId).send(validEvent);
    expect(res.status).toBe(201);
    return res.body.id as string;
  };

  it('rejects creating an event without authentication (401)', async () => {
    const res = await http().post('/v1/events').send(validEvent);
    expect(res.status).toBe(401);
  });

  it('rejects an invalid payload (400)', async () => {
    const res = await http()
      .post('/v1/events')
      .set('x-user-id', OWNER)
      .send({ ...validEvent, type: 'NOPE' });
    expect(res.status).toBe(400);
  });

  it('rejects a registration deadline after the start time (400)', async () => {
    const res = await http()
      .post('/v1/events')
      .set('x-user-id', OWNER)
      .send({ ...validEvent, registrationDeadline: '2026-07-11T00:00:00.000Z' });
    expect(res.status).toBe(400);
  });

  it('creates an event and lists it with the Japanese title', async () => {
    const id = await createEvent();
    const res = await http().get('/v1/events?lang=ja');
    expect(res.status).toBe(200);
    const found = res.body.find((e: { id: string }) => e.id === id);
    expect(found).toMatchObject({ title: '全社ミーティング', status: 'DRAFT' });
  });

  it('enforces the lifecycle: only an organizer publishes; state transitions are guarded', async () => {
    const id = await createEvent();

    // non-organizer cannot publish
    expect((await http().post(`/v1/events/${id}/publish`).set('x-user-id', OTHER)).status).toBe(403);

    // organizer publishes
    expect((await http().post(`/v1/events/${id}/publish`).set('x-user-id', OWNER)).status).toBe(201);

    const afterPublish = await http().get('/v1/events');
    expect(afterPublish.body.find((e: { id: string }) => e.id === id).status).toBe('PUBLISHED');

    // open registration, then reschedule keeps it REGISTRATION_OPEN with a new start
    expect(
      (await http().post(`/v1/events/${id}/open-registration`).set('x-user-id', OWNER)).status,
    ).toBe(201);
    const reschedule = await http()
      .patch(`/v1/events/${id}/schedule`)
      .set('x-user-id', OWNER)
      .send({ startAt: '2026-08-01T02:00:00.000Z', endAt: '2026-08-01T04:00:00.000Z' });
    expect(reschedule.status).toBe(200);

    const afterReschedule = await http().get('/v1/events');
    const row = afterReschedule.body.find((e: { id: string }) => e.id === id);
    expect(row.status).toBe('REGISTRATION_OPEN');
    expect(row.startAt).toBe('2026-08-01T02:00:00.000Z');

    // cancel, then publishing a cancelled event is a 409 conflict
    expect((await http().post(`/v1/events/${id}/cancel`).set('x-user-id', OWNER)).status).toBe(201);
    expect((await http().post(`/v1/events/${id}/publish`).set('x-user-id', OWNER)).status).toBe(409);
  });
});
