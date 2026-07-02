import { SurveyResponseEntity } from './survey-response.entity';
import { SurveyAnswer } from './survey-answer';

const NOW = new Date('2026-07-02T00:00:00Z');

describe('SurveyResponseEntity', () => {
  it('records an anonymous submission with its answers and raises an event', () => {
    const answers = [
      SurveyAnswer.rating('q1', 5),
      SurveyAnswer.choices('q2', ['a', 'b']),
      SurveyAnswer.text('q3', 'Tốt'),
    ];
    const response = SurveyResponseEntity.submit('srv-1', 'token-abc', answers, 'resp-1', NOW);

    expect(response.surveyId).toBe('srv-1');
    expect(response.respondentToken).toBe('token-abc'); // token, never the user id
    expect(response.answers).toHaveLength(3);
    expect(response.submittedAt).toBe(NOW);
    expect(response.domainEvents).toHaveLength(1);
  });

  it('guards against an empty survey id / token on construction', () => {
    expect(() => SurveyResponseEntity.submit('', 'token', [], 'resp-1', NOW)).toThrow();
    expect(() => SurveyResponseEntity.submit('srv-1', '', [], 'resp-1', NOW)).toThrow();
  });
});
