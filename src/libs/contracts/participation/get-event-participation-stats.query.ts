import { QueryBase } from '@libs/ddd';

/**
 * Shared contract (libs/contracts) so the `event` context can aggregate participation numbers for
 * its event report over the QueryBus without importing the `participation` internals. Both sides
 * import this libs file, not each other — dependency-cruiser's no-cross-module rule still holds.
 */
export class GetEventParticipationStatsQuery extends QueryBase {
  readonly eventId: string;

  constructor(props: { eventId: string }) {
    super();
    this.eventId = props.eventId;
  }
}

export interface EventParticipationStats {
  /** Registrations still in REGISTERED status. */
  registered: number;
  /** Registrations that were cancelled. */
  cancelled: number;
  /** REGISTERED registrations that have checked in. */
  checkedIn: number;
  /** REGISTERED individual registrations. */
  individual: number;
  /** REGISTERED team registrations. */
  team: number;
  /** checkedIn / registered, rounded to 2 decimals (0 when there are no registrations). */
  checkInRate: number;
}
