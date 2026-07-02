import { RepositoryPort } from '@libs/ddd';
import { SurveyEntity } from '../../domain/survey.entity';

export const SURVEY_REPOSITORY = Symbol('SURVEY_REPOSITORY');

export interface SurveyRepositoryPort extends RepositoryPort<SurveyEntity> {
  findByEventId(eventId: string): Promise<SurveyEntity[]>;
}
