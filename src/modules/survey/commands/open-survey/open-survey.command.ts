import { Command, CommandProps } from '@libs/ddd';

export class OpenSurveyCommand extends Command {
  readonly surveyId: string;
  readonly actorId: string;

  constructor(props: CommandProps<OpenSurveyCommand>) {
    super(props);
    this.surveyId = props.surveyId;
    this.actorId = props.actorId;
  }
}
