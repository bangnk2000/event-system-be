import { Injectable } from '@nestjs/common';
import { Mapper } from '@libs/ddd';
import { SurveyEntity } from '../domain/survey.entity';
import { SurveyQuestion } from '../domain/survey-question';
import { MultilingualText } from '../domain/value-objects/multilingual-text.value-object';
import { SurveyOrmEntity } from './survey.persistence.model';
import { SurveyDto } from '../dtos/survey.response.dto';

@Injectable()
export class SurveyMapper implements Mapper<SurveyEntity, SurveyOrmEntity, SurveyDto> {
  /** Reconstitution: rebuild the entity DIRECTLY (no factory) so loading does NOT re-emit events. */
  toDomain(record: SurveyOrmEntity): SurveyEntity {
    return new SurveyEntity({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        eventId: record.eventId,
        ownerId: record.ownerId,
        title: MultilingualText.create(record.titleVi, record.titleJa ?? undefined),
        description: record.descriptionVi
          ? MultilingualText.create(record.descriptionVi, record.descriptionJa ?? undefined)
          : null,
        status: record.status,
        respondentScope: record.respondentScope,
        questions: record.questions.map(
          (q) =>
            new SurveyQuestion(
              q.questionId,
              q.order,
              q.type,
              MultilingualText.create(q.promptVi, q.promptJa ?? undefined),
              q.required,
              q.options.map((o) => ({
                key: o.key,
                label: MultilingualText.create(o.labelVi, o.labelJa ?? undefined),
              })),
            ),
        ),
      },
    });
  }

  toPersistence(entity: SurveyEntity): SurveyOrmEntity {
    const props = entity.getProps();
    const row = new SurveyOrmEntity();
    row.id = props.id;
    row.eventId = props.eventId;
    row.ownerId = props.ownerId;
    row.titleVi = props.title.vi;
    row.titleJa = props.title.ja ?? null;
    row.descriptionVi = props.description?.vi ?? null;
    row.descriptionJa = props.description?.ja ?? null;
    row.status = props.status;
    row.respondentScope = props.respondentScope;
    row.questions = props.questions.map((q) => ({
      questionId: q.questionId,
      order: q.order,
      type: q.type,
      promptVi: q.prompt.vi,
      promptJa: q.prompt.ja ?? null,
      required: q.required,
      options: q.options.map((o) => ({
        key: o.key,
        labelVi: o.label.vi,
        labelJa: o.label.ja ?? null,
      })),
    }));
    row.createdAt = props.createdAt;
    row.updatedAt = props.updatedAt;
    return row;
  }

  toResponse(entity: SurveyEntity): SurveyDto {
    const props = entity.getProps();
    const dto = new SurveyDto();
    dto.id = props.id;
    dto.eventId = props.eventId;
    dto.titleVi = props.title.vi;
    dto.titleJa = props.title.ja ?? null;
    dto.status = props.status;
    dto.respondentScope = props.respondentScope;
    dto.questionCount = props.questions.length;
    return dto;
  }
}
