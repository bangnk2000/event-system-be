import { RepositoryPort } from '@libs/ddd';
import { SurveyResponseEntity } from '../../domain/survey-response.entity';

export const SURVEY_RESPONSE_REPOSITORY = Symbol('SURVEY_RESPONSE_REPOSITORY');

export interface SurveyResponseRepositoryPort extends RepositoryPort<SurveyResponseEntity> {
  existsBySurveyAndToken(surveyId: string, respondentToken: string): Promise<boolean>;
}
