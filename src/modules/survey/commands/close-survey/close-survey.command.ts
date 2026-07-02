import { Command, CommandProps } from '@libs/ddd';

export class CloseSurveyCommand extends Command {
  readonly surveyId: string;
  readonly actorId: string;

  constructor(props: CommandProps<CloseSurveyCommand>) {
    super(props);
    this.surveyId = props.surveyId;
    this.actorId = props.actorId;
  }
}
