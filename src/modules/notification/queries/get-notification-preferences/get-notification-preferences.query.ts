import { QueryBase } from '@libs/ddd';

export class GetNotificationPreferencesQuery extends QueryBase {
  readonly userId: string;

  constructor(props: { userId: string }) {
    super();
    this.userId = props.userId;
  }
}
