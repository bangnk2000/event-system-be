import { Injectable } from '@nestjs/common';
import { Mapper } from '@libs/ddd';
import { SurveyResponseEntity } from '../domain/survey-response.entity';
import { SurveyAnswer } from '../domain/survey-answer';
import { SurveyResponseOrmEntity } from './survey-response.persistence.model';

function rowToAnswer(row: {
  questionId: string;
  ratingValue: number | null;
  choiceKeys: string[] | null;
  textValue: string | null;
}): SurveyAnswer {
  if (row.ratingValue !== null) return SurveyAnswer.rating(row.questionId, row.ratingValue);
  if (row.choiceKeys !== null) return SurveyAnswer.choices(row.questionId, row.choiceKeys);
  return SurveyAnswer.text(row.questionId, row.textValue ?? '');
}

@Injectable()
export class SurveyResponseMapper
  implements Mapper<SurveyResponseEntity, SurveyResponseOrmEntity, { id: string }>
{
  toDomain(record: SurveyResponseOrmEntity): SurveyResponseEntity {
    return new SurveyResponseEntity({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        surveyId: record.surveyId,
        respondentToken: record.respondentToken,
        answers: record.answers.map(rowToAnswer),
        submittedAt: record.submittedAt,
      },
    });
  }

  toPersistence(entity: SurveyResponseEntity): SurveyResponseOrmEntity {
    const props = entity.getProps();
    const row = new SurveyResponseOrmEntity();
    row.id = props.id;
    row.surveyId = props.surveyId;
    row.respondentToken = props.respondentToken;
    row.answers = props.answers.map((a) => ({
      questionId: a.questionId,
      ratingValue: a.ratingValue,
      choiceKeys: a.choiceKeys,
      textValue: a.textValue,
    }));
    row.submittedAt = props.submittedAt;
    row.createdAt = props.createdAt;
    row.updatedAt = props.updatedAt;
    return row;
  }

  toResponse(entity: SurveyResponseEntity): { id: string } {
    return { id: entity.id };
  }
}
