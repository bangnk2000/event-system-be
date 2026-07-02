import request from 'supertest';
import { cleanDatabase, closeTestApp, createTestApp, TestContext } from './setup/test-app';

const ORG = '11111111-1111-1111-1111-111111111111';
const USER_A = '33333333-3333-3333-3333-333333333333';
const USER_B = '44444444-4444-4444-4444-444444444444';
const OUTSIDER = '99999999-9999-9999-9999-999999999999';
const MISSING_EVENT = '00000000-0000-0000-0000-000000000000';

describe('Survey API (e2e)', () => {
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

  /** Event walked to REGISTRATION_OPEN with USER_A and USER_B registered. */
  const createEventWithRegistrants = async (): Promise<string> => {
    const res = await http()
      .post('/v1/events')
      .set('x-user-id', ORG)
      .send({
        titleVi: 'Team building',
        type: 'TEAM_BUILDING',
        startAt: '2026-07-10T02:00:00.000Z',
        endAt: '2026-07-10T04:00:00.000Z',
        registrationMode: 'INDIVIDUAL',
      });
    const eventId = res.body.id as string;
    await http().post(`/v1/events/${eventId}/publish`).set('x-user-id', ORG);
    await http().post(`/v1/events/${eventId}/open-registration`).set('x-user-id', ORG);
    for (const user of [USER_A, USER_B]) {
      await http()
        .post(`/v1/events/${eventId}/registrations`)
        .set('x-user-id', user)
        .send({ mode: 'INDIVIDUAL' });
    }
    return eventId;
  };

  const surveyBody = {
    titleVi: 'Khảo sát sau sự kiện',
    questions: [
      { type: 'RATING', promptVi: 'Mức độ hài lòng', required: true },
      {
        type: 'SINGLE_CHOICE',
        promptVi: 'Bạn sẽ tham gia lần sau?',
        required: true,
        options: [
          { key: 'yes', labelVi: 'Có' },
          { key: 'no', labelVi: 'Không' },
        ],
      },
      { type: 'TEXT', promptVi: 'Góp ý thêm', required: false },
    ],
  };

  const createSurvey = async (eventId: string): Promise<string> =>
    (await http().post(`/v1/events/${eventId}/surveys`).set('x-user-id', ORG).send(surveyBody)).body
      .id as string;

  it('authorizes survey creation via the cross-context organizer check', async () => {
    const eventId = await createEventWithRegistrants();

    expect(
      (await http().post(`/v1/events/${eventId}/surveys`).set('x-user-id', OUTSIDER).send(surveyBody))
        .status,
    ).toBe(403);

    expect(
      (
        await http()
          .post(`/v1/events/${MISSING_EVENT}/surveys`)
          .set('x-user-id', ORG)
          .send(surveyBody)
      ).status,
    ).toBe(404);

    expect(
      (await http().post(`/v1/events/${eventId}/surveys`).set('x-user-id', ORG).send(surveyBody))
        .status,
    ).toBe(201);
  });

  it('rejects a choice question without enough options (400)', async () => {
    const eventId = await createEventWithRegistrants();
    const res = await http()
      .post(`/v1/events/${eventId}/surveys`)
      .set('x-user-id', ORG)
      .send({
        titleVi: 'Bad survey',
        questions: [
          { type: 'SINGLE_CHOICE', promptVi: 'x', required: true, options: [{ key: 'a', labelVi: 'A' }] },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('collects anonymous responses and aggregates results for organizers only', async () => {
    const eventId = await createEventWithRegistrants();
    const surveyId = await createSurvey(eventId);

    // question ids are generated server-side — read them back to build answers
    const detail = await http().get(`/v1/surveys/${surveyId}`);
    expect(detail.status).toBe(200);
    const [qRating, qChoice, qText] = detail.body.questions.map((q: { questionId: string }) => q.questionId);

    // cannot submit before it is opened
    expect(
      (
        await http()
          .post(`/v1/surveys/${surveyId}/responses`)
          .set('x-user-id', USER_A)
          .send({ answers: [{ questionId: qRating, ratingValue: 5 }] })
      ).status,
    ).toBe(409);

    expect((await http().post(`/v1/surveys/${surveyId}/open`).set('x-user-id', ORG)).status).toBe(201);

    // a non-registrant is not eligible
    expect(
      (
        await http()
          .post(`/v1/surveys/${surveyId}/responses`)
          .set('x-user-id', OUTSIDER)
          .send({
            answers: [
              { questionId: qRating, ratingValue: 4 },
              { questionId: qChoice, choiceKeys: ['yes'] },
            ],
          })
      ).status,
    ).toBe(403);

    // missing a required answer -> 400
    expect(
      (
        await http()
          .post(`/v1/surveys/${surveyId}/responses`)
          .set('x-user-id', USER_A)
          .send({ answers: [{ questionId: qRating, ratingValue: 5 }] })
      ).status,
    ).toBe(400);

    // USER_A submits a full, valid response
    expect(
      (
        await http()
          .post(`/v1/surveys/${surveyId}/responses`)
          .set('x-user-id', USER_A)
          .send({
            answers: [
              { questionId: qRating, ratingValue: 5 },
              { questionId: qChoice, choiceKeys: ['yes'] },
              { questionId: qText, textValue: 'Rất tốt' },
            ],
          })
      ).status,
    ).toBe(201);

    // ...and cannot submit twice
    expect(
      (
        await http()
          .post(`/v1/surveys/${surveyId}/responses`)
          .set('x-user-id', USER_A)
          .send({
            answers: [
              { questionId: qRating, ratingValue: 1 },
              { questionId: qChoice, choiceKeys: ['no'] },
            ],
          })
      ).status,
    ).toBe(409);

    // USER_B submits (text is optional and omitted)
    expect(
      (
        await http()
          .post(`/v1/surveys/${surveyId}/responses`)
          .set('x-user-id', USER_B)
          .send({
            answers: [
              { questionId: qRating, ratingValue: 3 },
              { questionId: qChoice, choiceKeys: ['no'] },
            ],
          })
      ).status,
    ).toBe(201);

    // results are organizer-only
    expect((await http().get(`/v1/surveys/${surveyId}/results`).set('x-user-id', USER_A)).status).toBe(403);

    const results = await http().get(`/v1/surveys/${surveyId}/results`).set('x-user-id', ORG);
    expect(results.status).toBe(200);
    expect(results.body).toMatchObject({
      responded: 2,
      eligible: 2,
      responseRate: 1,
    });

    const ratingResult = results.body.questions.find((q: { questionId: string }) => q.questionId === qRating);
    expect(ratingResult.average).toBe(4); // (5 + 3) / 2
    expect(ratingResult.distribution).toEqual(
      expect.arrayContaining([
        { rating: 5, count: 1 },
        { rating: 3, count: 1 },
      ]),
    );

    const choiceResult = results.body.questions.find((q: { questionId: string }) => q.questionId === qChoice);
    expect(choiceResult.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'yes', count: 1 }),
        expect.objectContaining({ key: 'no', count: 1 }),
      ]),
    );

    const textResult = results.body.questions.find((q: { questionId: string }) => q.questionId === qText);
    expect(textResult.textAnswers).toEqual(['Rất tốt']);
  });
});
