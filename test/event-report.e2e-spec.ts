import request from 'supertest';
import { cleanDatabase, closeTestApp, createTestApp, TestContext } from './setup/test-app';

const ORG = '11111111-1111-1111-1111-111111111111';
const OUTSIDER = '99999999-9999-9999-9999-999999999999';
const USER_A = '33333333-3333-3333-3333-333333333333';
const USER_B = '44444444-4444-4444-4444-444444444444';
const USER_C = '55555555-5555-5555-5555-555555555555';

describe('Event report API (e2e)', () => {
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

  /** Creates an event and walks it to REGISTRATION_OPEN. */
  const createOpenEvent = async (): Promise<string> => {
    const res = await http()
      .post('/v1/events')
      .set('x-user-id', ORG)
      .send({
        titleVi: 'Giải bóng đá nội bộ',
        type: 'TEAM_BUILDING',
        startAt: '2026-07-10T02:00:00.000Z',
        endAt: '2026-07-10T04:00:00.000Z',
        registrationMode: 'BOTH',
      });
    const eventId = res.body.id as string;
    await http().post(`/v1/events/${eventId}/publish`).set('x-user-id', ORG);
    await http().post(`/v1/events/${eventId}/open-registration`).set('x-user-id', ORG);
    return eventId;
  };

  it('aggregates participation and budget into the report (organizer only)', async () => {
    const eventId = await createOpenEvent();

    // 2 individuals + 1 team; cancel one individual; check in the other individual.
    const regA = (
      await http()
        .post(`/v1/events/${eventId}/registrations`)
        .set('x-user-id', USER_A)
        .send({ mode: 'INDIVIDUAL' })
    ).body.id as string;
    await http()
      .post(`/v1/events/${eventId}/registrations`)
      .set('x-user-id', USER_B)
      .send({ mode: 'TEAM', teamName: 'Team Alpha' });
    const regC = (
      await http()
        .post(`/v1/events/${eventId}/registrations`)
        .set('x-user-id', USER_C)
        .send({ mode: 'INDIVIDUAL' })
    ).body.id as string;

    await http().post(`/v1/registrations/${regA}/check-in`).set('x-user-id', ORG);
    await http().post(`/v1/registrations/${regC}/cancel`).set('x-user-id', USER_C);

    // budget: one item planned 5M, actual 5.5M -> variance -500k
    const budgetId = (
      await http().post(`/v1/events/${eventId}/budget`).set('x-user-id', ORG).send({})
    ).body.id as string;
    const itemId = (
      await http()
        .post(`/v1/budgets/${budgetId}/items`)
        .set('x-user-id', ORG)
        .send({ name: 'Thuê sân', category: 'VENUE', plannedAmount: 5_000_000 })
    ).body.id as string;
    await http()
      .patch(`/v1/budgets/${budgetId}/items/${itemId}/actual`)
      .set('x-user-id', ORG)
      .send({ actualAmount: 5_500_000 });

    const report = await http().get(`/v1/events/${eventId}/report`).set('x-user-id', ORG);
    expect(report.status).toBe(200);
    expect(report.body.event).toMatchObject({
      eventId,
      title: 'Giải bóng đá nội bộ',
      status: 'REGISTRATION_OPEN',
    });
    expect(report.body.participation).toMatchObject({
      registered: 2, // A (individual) + B (team); C cancelled
      cancelled: 1,
      checkedIn: 1,
      individual: 1,
      team: 1,
      checkInRate: 0.5,
    });
    expect(report.body.budget).toMatchObject({
      exists: true,
      currency: 'VND',
      status: 'DRAFT',
      totalPlanned: 5_000_000,
      totalActual: 5_500_000,
      variance: -500_000,
    });
    expect(typeof report.body.generatedAt).toBe('string');
  });

  it('reports zeroed budget when the event has no budget', async () => {
    const eventId = await createOpenEvent();
    const report = await http().get(`/v1/events/${eventId}/report`).set('x-user-id', ORG);
    expect(report.status).toBe(200);
    expect(report.body.budget).toMatchObject({ exists: false, totalPlanned: 0, variance: 0 });
    expect(report.body.participation.registered).toBe(0);
  });

  it('forbids non-organizers (403) and 404s an unknown event', async () => {
    const eventId = await createOpenEvent();
    expect((await http().get(`/v1/events/${eventId}/report`).set('x-user-id', OUTSIDER)).status).toBe(403);
    expect(
      (
        await http()
          .get('/v1/events/00000000-0000-0000-0000-000000000000/report')
          .set('x-user-id', ORG)
      ).status,
    ).toBe(404);
  });
});
