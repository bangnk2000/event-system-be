import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SURVEY_REPOSITORY } from './application/ports/survey.repository.port';
import { SURVEY_RESPONSE_REPOSITORY } from './application/ports/survey-response.repository.port';
import { CreateSurveyService } from './commands/create-survey/create-survey.service';
import { CreateSurveyHttpController } from './commands/create-survey/create-survey.http.controller';
import { OpenSurveyService } from './commands/open-survey/open-survey.service';
import { OpenSurveyHttpController } from './commands/open-survey/open-survey.http.controller';
import { CloseSurveyService } from './commands/close-survey/close-survey.service';
import { CloseSurveyHttpController } from './commands/close-survey/close-survey.http.controller';
import { SubmitResponseService } from './commands/submit-response/submit-response.service';
import { SubmitResponseHttpController } from './commands/submit-response/submit-response.http.controller';
import { GetSurveyDetailQueryHandler } from './queries/get-survey-detail/get-survey-detail.query-handler';
import { GetSurveyDetailHttpController } from './queries/get-survey-detail/get-survey-detail.http.controller';
import { ListEventSurveysQueryHandler } from './queries/list-event-surveys/list-event-surveys.query-handler';
import { ListEventSurveysHttpController } from './queries/list-event-surveys/list-event-surveys.http.controller';
import { GetSurveyResultsQueryHandler } from './queries/get-survey-results/get-survey-results.query-handler';
import { GetSurveyResultsHttpController } from './queries/get-survey-results/get-survey-results.http.controller';
import { SurveyRepository } from './database/survey.repository';
import { SurveyResponseRepository } from './database/survey-response.repository';
import { SurveyMapper } from './database/survey.mapper';
import { SurveyResponseMapper } from './database/survey-response.mapper';

@Module({
  imports: [CqrsModule],
  controllers: [
    CreateSurveyHttpController,
    OpenSurveyHttpController,
    CloseSurveyHttpController,
    SubmitResponseHttpController,
    GetSurveyDetailHttpController,
    ListEventSurveysHttpController,
    GetSurveyResultsHttpController,
  ],
  providers: [
    SurveyMapper,
    SurveyResponseMapper,
    CreateSurveyService,
    OpenSurveyService,
    CloseSurveyService,
    SubmitResponseService,
    GetSurveyDetailQueryHandler,
    ListEventSurveysQueryHandler,
    GetSurveyResultsQueryHandler,
    { provide: SURVEY_REPOSITORY, useClass: SurveyRepository },
    { provide: SURVEY_RESPONSE_REPOSITORY, useClass: SurveyResponseRepository },
  ],
})
export class SurveyModule {}
