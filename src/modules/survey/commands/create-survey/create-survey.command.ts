import { Command, CommandProps } from '@libs/ddd';
import { QuestionType, RespondentScope } from '../../domain/survey.types';

export interface CreateSurveyQuestionInput {
  type: QuestionType;
  promptVi: string;
  promptJa?: string;
  required: boolean;
  options?: { key: string; labelVi: string; labelJa?: string }[];
}

export class CreateSurveyCommand extends Command {
  readonly eventId: string;
  readonly actorId: string;
  readonly titleVi: string;
  readonly titleJa?: string;
  readonly descriptionVi?: string;
  readonly descriptionJa?: string;
  readonly respondentScope: RespondentScope;
  readonly questions: CreateSurveyQuestionInput[];

  constructor(props: CommandProps<CreateSurveyCommand>) {
    super(props);
    this.eventId = props.eventId;
    this.actorId = props.actorId;
    this.titleVi = props.titleVi;
    this.titleJa = props.titleJa;
    this.descriptionVi = props.descriptionVi;
    this.descriptionJa = props.descriptionJa;
    this.respondentScope = props.respondentScope;
    this.questions = props.questions;
  }
}
