import { Err, Ok, Result } from 'oxide.ts';
import { ArgumentInvalidException } from '@libs/exceptions';
import { MultilingualText } from './value-objects/multilingual-text.value-object';
import { SurveyAnswer } from './survey-answer';
import { InvalidAnswerError } from './survey.errors';

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export enum QuestionType {
  RATING = 'RATING',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TEXT = 'TEXT',
}

/** A raw, not-yet-validated answer coming from the request, keyed by question. */
export interface AnswerInput {
  questionId: string;
  ratingValue?: number;
  choiceKeys?: string[];
  textValue?: string;
}

/** A selectable option for SINGLE/MULTIPLE choice questions. */
export interface QuestionOption {
  key: string;
  label: MultilingualText;
}

/**
 * A survey question (internal to the Survey aggregate). Immutable.
 * Self-validates its configuration on construction and knows how to validate an incoming answer.
 */
export class SurveyQuestion {
  constructor(
    readonly questionId: string,
    readonly order: number,
    readonly type: QuestionType,
    readonly prompt: MultilingualText,
    readonly required: boolean,
    readonly options: QuestionOption[],
  ) {
    this.validateConfig();
  }

  private get isChoice(): boolean {
    return this.type === QuestionType.SINGLE_CHOICE || this.type === QuestionType.MULTIPLE_CHOICE;
  }

  private validateConfig(): void {
    if (this.isChoice) {
      if (this.options.length < 2) {
        throw new ArgumentInvalidException('A choice question needs at least 2 options');
      }
      const keys = this.options.map((o) => o.key);
      if (new Set(keys).size !== keys.length) {
        throw new ArgumentInvalidException('Option keys must be unique within a question');
      }
    } else if (this.options.length > 0) {
      throw new ArgumentInvalidException(`A ${this.type} question must not have options`);
    }
  }

  private hasOption(key: string): boolean {
    return this.options.some((o) => o.key === key);
  }

  /**
   * Validate + normalize a raw answer for THIS question.
   * Returns Ok(null) when the (optional) question was left blank, Ok(answer) when valid,
   * Err(InvalidAnswerError) when the value is missing-but-required or the wrong shape.
   */
  buildAnswer(input: AnswerInput | undefined): Result<SurveyAnswer | null, InvalidAnswerError> {
    const answered =
      input !== undefined &&
      (input.ratingValue !== undefined ||
        (input.choiceKeys?.length ?? 0) > 0 ||
        (input.textValue?.trim() ?? '') !== '');

    if (!answered) {
      return this.required
        ? Err(new InvalidAnswerError(`Question ${this.questionId} is required`))
        : Ok(null);
    }

    switch (this.type) {
      case QuestionType.RATING: {
        const value = input!.ratingValue;
        if (
          value === undefined ||
          !Number.isInteger(value) ||
          value < RATING_MIN ||
          value > RATING_MAX
        ) {
          return Err(
            new InvalidAnswerError(
              `Rating for ${this.questionId} must be an integer ${RATING_MIN}..${RATING_MAX}`,
            ),
          );
        }
        return Ok(SurveyAnswer.rating(this.questionId, value));
      }
      case QuestionType.SINGLE_CHOICE: {
        const keys = input!.choiceKeys ?? [];
        if (keys.length !== 1 || !this.hasOption(keys[0])) {
          return Err(
            new InvalidAnswerError(
              `Single-choice ${this.questionId} needs exactly one valid option`,
            ),
          );
        }
        return Ok(SurveyAnswer.choices(this.questionId, [keys[0]]));
      }
      case QuestionType.MULTIPLE_CHOICE: {
        const unique = Array.from(new Set(input!.choiceKeys ?? []));
        if (unique.length === 0 || !unique.every((k) => this.hasOption(k))) {
          return Err(
            new InvalidAnswerError(`Multiple-choice ${this.questionId} has invalid options`),
          );
        }
        return Ok(SurveyAnswer.choices(this.questionId, unique));
      }
      case QuestionType.TEXT: {
        return Ok(SurveyAnswer.text(this.questionId, input!.textValue!.trim()));
      }
    }
  }
}
