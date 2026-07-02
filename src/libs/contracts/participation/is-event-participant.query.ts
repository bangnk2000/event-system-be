import { QueryBase } from '@libs/ddd';

/**
 * Shared contract (libs/contracts) so OTHER contexts (e.g. `survey`) can ask the `participation`
 * context whether a user may act as a participant of an event — over the QueryBus, without importing
 * its internals. Both sides import this libs file, not each other (dependency-cruiser's no-cross-module
 * rule still holds).
 */
export class IsEventParticipantQuery extends QueryBase {
  readonly eventId: string;
  readonly userId: string;

  constructor(props: { eventId: string; userId: string }) {
    super();
    this.eventId = props.eventId;
    this.userId = props.userId;
  }
}

export interface IsEventParticipantResult {
  /** The user has an active (non-cancelled) registration for the event. */
  registered: boolean;
  /** The user's active registration has been checked in. */
  checkedIn: boolean;
}
