import { QueryBase } from '@libs/ddd';

/**
 * Shared contract (libs/contracts) so OTHER contexts can ask the `event` context a question over the
 * QueryBus without importing its internals. This is how cross-context coupling stays loose and
 * dependency-cruiser's no-cross-module rule still holds (both sides import this libs file, not each other).
 */
export class IsEventOrganizerQuery extends QueryBase {
  readonly eventId: string;
  readonly userId: string;

  constructor(props: { eventId: string; userId: string }) {
    super();
    this.eventId = props.eventId;
    this.userId = props.userId;
  }
}

export interface IsEventOrganizerResult {
  eventExists: boolean;
  isOrganizer: boolean;
}
