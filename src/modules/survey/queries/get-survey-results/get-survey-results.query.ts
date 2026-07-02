import { QueryBase } from '@libs/ddd';

export class GetSurveyResultsQuery extends QueryBase {
  readonly surveyId: string;
  readonly actorId: string;

  constructor(props: { surveyId: string; actorId: string }) {
    super();
    this.surveyId = props.surveyId;
    this.actorId = props.actorId;
  }
}
