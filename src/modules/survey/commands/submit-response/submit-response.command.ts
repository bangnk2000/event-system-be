import { Command, CommandProps } from '@libs/ddd';
import { AnswerInput } from '../../domain/survey.types';

export class SubmitResponseCommand extends Command {
  readonly surveyId: string;
  readonly actorId: string;
  readonly answers: AnswerInput[];

  constructor(props: CommandProps<SubmitResponseCommand>) {
    super(props);
    this.surveyId = props.surveyId;
    this.actorId = props.actorId;
    this.answers = props.answers;
  }
}
