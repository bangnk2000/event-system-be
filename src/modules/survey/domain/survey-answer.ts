/**
 * A single answer inside a SurveyResponse (internal to the aggregate). Immutable.
 * Exactly one of ratingValue / choiceKeys / textValue is set, matching the question's type.
 */
export class SurveyAnswer {
  private constructor(
    readonly questionId: string,
    readonly ratingValue: number | null,
    readonly choiceKeys: string[] | null,
    readonly textValue: string | null,
  ) {}

  static rating(questionId: string, value: number): SurveyAnswer {
    return new SurveyAnswer(questionId, value, null, null);
  }

  static choices(questionId: string, keys: string[]): SurveyAnswer {
    return new SurveyAnswer(questionId, null, keys, null);
  }

  static text(questionId: string, value: string): SurveyAnswer {
    return new SurveyAnswer(questionId, null, null, value);
  }
}
