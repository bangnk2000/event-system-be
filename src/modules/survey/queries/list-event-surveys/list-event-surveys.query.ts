import { QueryBase } from '@libs/ddd';

export class ListEventSurveysQuery extends QueryBase {
  readonly eventId: string;
  readonly actorId: string;

  constructor(props: { eventId: string; actorId: string }) {
    super();
    this.eventId = props.eventId;
    this.actorId = props.actorId;
  }
}
