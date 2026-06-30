import request from 'supertest';
import { cleanDatabase, closeTestApp, createTestApp, TestContext } from './setup/test-app';

const ORG = '11111111-1111-1111-1111-111111111111';
const OUTSIDER = '99999999-9999-9999-9999-999999999999';

describe('Budget API (e2e)', () => {
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
        titleVi: 'Hội thảo',
        type: 'TRAINING',
        startAt: '2026-07-10T02:00:00.000Z',
        endAt: '2026-07-10T04:00:00.000Z',
        registrationMode: 'INDIVIDUAL',
      });
    return res.body.id as string;
  };

  it('authorizes budget creation via the cross-context organizer check', async () => {
    const eventId = await createEvent();

    // non-organizer -> 403 (answer comes from the event context over the QueryBus)
    expect(
      (await http().post(`/v1/events/${eventId}/budget`).set('x-user-id', OUTSIDER).send({})).status,
    ).toBe(403);

    // unknown event -> 404
    expect(
      (
        await http()
          .post('/v1/events/00000000-0000-0000-0000-000000000000/budget')
          .set('x-user-id', ORG)
          .send({})
      ).status,
    ).toBe(404);

    // organizer -> 201, duplicate -> 409
    expect((await http().post(`/v1/events/${eventId}/budget`).set('x-user-id', ORG).send({})).status).toBe(201);
    expect((await http().post(`/v1/events/${eventId}/budget`).set('x-user-id', ORG).send({})).status).toBe(409);
  });

  it('tracks planned vs actual, computes variance, and locks after finalize', async () => {
    const eventId = await createEvent();
    const budgetId = (await http().post(`/v1/events/${eventId}/budget`).set('x-user-id', ORG).send({}))
      .body.id as string;

    const itemId = (
      await http()
        .post(`/v1/budgets/${budgetId}/items`)
        .set('x-user-id', ORG)
        .send({ name: 'Thuê hội trường', category: 'VENUE', plannedAmount: 5_000_000 })
    ).body.id as string;

    // record actual + invoice
    const rec = await http()
      .patch(`/v1/budgets/${budgetId}/items/${itemId}/actual`)
      .set('x-user-id', ORG)
      .send({ actualAmount: 5_500_000, invoiceUrl: 'https://drive/inv1' });
    expect(rec.status).toBe(200);

    // recording on a missing item -> 404
    expect(
      (
        await http()
          .patch(`/v1/budgets/${budgetId}/items/does-not-exist/actual`)
          .set('x-user-id', ORG)
          .send({ actualAmount: 1 })
      ).status,
    ).toBe(404);

    const summary = await http().get(`/v1/events/${eventId}/budget`);
    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({
      currency: 'VND',
      status: 'DRAFT',
      totalPlanned: 5_000_000,
      totalActual: 5_500_000,
      variance: -500_000,
    });

    // finalize -> further edits are 409
    expect((await http().post(`/v1/budgets/${budgetId}/finalize`).set('x-user-id', ORG)).status).toBe(201);
    expect(
      (
        await http()
          .post(`/v1/budgets/${budgetId}/items`)
          .set('x-user-id', ORG)
          .send({ name: 'x', category: 'MISC', plannedAmount: 1 })
      ).status,
    ).toBe(409);
  });
});
