import request from 'supertest';
import { cleanDatabase, closeTestApp, createTestApp, TestContext } from './setup/test-app';

const USER = '55555555-5555-5555-5555-555555555555';

describe('Notification preferences API (e2e)', () => {
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

  it('defaults every notification type to enabled for a user with no stored preference', async () => {
    const res = await http().get('/v1/notification-preferences').set('x-user-id', USER);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(USER);
    expect(res.body.preferences.REGISTRATION_CANCELLED).toBe(true);
  });

  it('opts out of a type and persists it (GET reflects the update)', async () => {
    const put = await http()
      .put('/v1/notification-preferences')
      .set('x-user-id', USER)
      .send({ type: 'REGISTRATION_CANCELLED', enabled: false });
    expect(put.status).toBe(200);
    expect(put.body.preferences.REGISTRATION_CANCELLED).toBe(false);

    const get = await http().get('/v1/notification-preferences').set('x-user-id', USER);
    expect(get.body.preferences.REGISTRATION_CANCELLED).toBe(false);
  });

  it('opts back in', async () => {
    await http()
      .put('/v1/notification-preferences')
      .set('x-user-id', USER)
      .send({ type: 'REGISTRATION_CANCELLED', enabled: false });
    const back = await http()
      .put('/v1/notification-preferences')
      .set('x-user-id', USER)
      .send({ type: 'REGISTRATION_CANCELLED', enabled: true });
    expect(back.body.preferences.REGISTRATION_CANCELLED).toBe(true);
  });

  it('rejects an unknown notification type (400)', async () => {
    const res = await http()
      .put('/v1/notification-preferences')
      .set('x-user-id', USER)
      .send({ type: 'NOPE', enabled: true });
    expect(res.status).toBe(400);
  });
});
