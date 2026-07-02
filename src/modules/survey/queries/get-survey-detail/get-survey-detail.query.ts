import { QueryBase } from '@libs/ddd';

export class GetSurveyDetailQuery extends QueryBase {
  readonly surveyId: string;

  constructor(props: { surveyId: string }) {
    super();
    this.surveyId = props.surveyId;
  }
}
