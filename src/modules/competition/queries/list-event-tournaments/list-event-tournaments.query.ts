import { QueryBase } from '@libs/ddd';

export class ListEventTournamentsQuery extends QueryBase {
  readonly eventId: string;

  constructor(props: { eventId: string }) {
    super();
    this.eventId = props.eventId;
  }
}
