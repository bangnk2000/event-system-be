import { SurveyEntity } from './survey.entity';
import { SurveyQuestion } from './survey-question';
import { MultilingualText } from './value-objects/multilingual-text.value-object';
import { QuestionType, RespondentScope, SurveyStatus } from './survey.types';

const NOW = new Date('2026-07-02T00:00:00Z');
const text = (vi: string): MultilingualText => MultilingualText.create(vi);

const rating = (id: string, required = true): SurveyQuestion =>
  new SurveyQuestion(id, 0, QuestionType.RATING, text('Điểm hài lòng'), required, []);

const single = (id: string): SurveyQuestion =>
  new SurveyQuestion(id, 1, QuestionType.SINGLE_CHOICE, text('Chọn một'), true, [
    { key: 'a', label: text('A') },
    { key: 'b', label: text('B') },
  ]);

const draft = (questions: SurveyQuestion[]): SurveyEntity =>
  SurveyEntity.create(
    {
      eventId: 'evt-1',
      ownerId: 'owner-1',
      title: text('Khảo sát'),
      description: null,
      respondentScope: RespondentScope.REGISTRANTS,
      questions,
    },
    'srv-1',
    NOW,
  );

describe('SurveyEntity', () => {
  describe('lifecycle', () => {
    it('opens a draft with questions and blocks re-opening', () => {
      const survey = draft([rating('q1')]);
      expect(survey.status).toBe(SurveyStatus.DRAFT);
      expect(survey.open(NOW).isOk()).toBe(true);
      expect(survey.status).toBe(SurveyStatus.OPEN);
      expect(survey.open(NOW).isErr()).toBe(true); // already open
    });

    it('refuses to open without questions', () => {
      const survey = draft([]);
      expect(survey.open(NOW).isErr()).toBe(true);
      expect(survey.status).toBe(SurveyStatus.DRAFT);
    });

    it('closes only an open survey', () => {
      const survey = draft([rating('q1')]);
      expect(survey.close(NOW).isErr()).toBe(true); // still draft
      survey.open(NOW);
      expect(survey.close(NOW).isOk()).toBe(true);
      expect(survey.status).toBe(SurveyStatus.CLOSED);
      expect(survey.close(NOW).isErr()).toBe(true); // terminal
    });
  });

  describe('buildAnswers', () => {
    it('accepts valid answers and drops blank optional ones', () => {
      const survey = draft([rating('q1'), single('q2')]);
      const result = survey.buildAnswers([
        { questionId: 'q1', ratingValue: 4 },
        { questionId: 'q2', choiceKeys: ['a'] },
      ]);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toHaveLength(2);
    });

    it('rejects a missing required answer', () => {
      const survey = draft([rating('q1')]);
      expect(survey.buildAnswers([]).isErr()).toBe(true);
    });

    it('rejects an out-of-range rating', () => {
      const survey = draft([rating('q1')]);
      expect(survey.buildAnswers([{ questionId: 'q1', ratingValue: 9 }]).isErr()).toBe(true);
    });

    it('rejects a single-choice answer with an unknown option', () => {
      const survey = draft([single('q2')]);
      expect(survey.buildAnswers([{ questionId: 'q2', choiceKeys: ['zzz'] }]).isErr()).toBe(true);
    });

    it('rejects an answer to an unknown question', () => {
      const survey = draft([rating('q1')]);
      expect(
        survey.buildAnswers([
          { questionId: 'q1', ratingValue: 3 },
          { questionId: 'ghost', ratingValue: 1 },
        ]).isErr(),
      ).toBe(true);
    });
  });

  it('rejects a choice question configured with fewer than 2 options', () => {
    expect(
      () =>
        new SurveyQuestion('q', 0, QuestionType.SINGLE_CHOICE, text('x'), true, [
          { key: 'only', label: text('Only') },
        ]),
    ).toThrow();
  });
});
