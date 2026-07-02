import { QueryBase } from '@libs/ddd';

export class GetEventReportQuery extends QueryBase {
  readonly eventId: string;
  /** Acting user — must be an organizer of the event to view the report. */
  readonly requesterId: string;

  constructor(props: { eventId: string; requesterId: string }) {
    super();
    this.eventId = props.eventId;
    this.requesterId = props.requesterId;
  }
}
