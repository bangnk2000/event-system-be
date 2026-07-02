import { MultilingualText } from './value-objects/multilingual-text.value-object';
import { SurveyQuestion } from './survey-question';

// Re-exported here so the rest of the module keeps a single import site for question shapes.
// They LIVE in survey-question.ts to avoid a survey.types ⇄ survey-question import cycle.
export { QuestionType, type AnswerInput } from './survey-question';

export enum SurveyStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

/** Who is allowed to answer a survey. */
export enum RespondentScope {
  /** Anyone with an active registration for the event. */
  REGISTRANTS = 'REGISTRANTS',
  /** Only registrants who have checked in. */
  ATTENDEES = 'ATTENDEES',
}

export interface SurveyProps {
  eventId: string;
  ownerId: string; // the organizer who created the survey (record only; authz is cross-context)
  title: MultilingualText;
  description: MultilingualText | null;
  status: SurveyStatus;
  respondentScope: RespondentScope;
  questions: SurveyQuestion[];
}
