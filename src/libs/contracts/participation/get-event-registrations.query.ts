import { QueryBase } from '@libs/ddd';

/**
 * Shared contract (libs/contracts) so the `competition` context can promote registrations into
 * competitors over the QueryBus without importing `participation` internals. Both sides import this
 * libs file, not each other — dependency-cruiser's no-cross-module rule still holds.
 */
export class GetEventRegistrationsQuery extends QueryBase {
  readonly eventId: string;

  constructor(props: { eventId: string }) {
    super();
    this.eventId = props.eventId;
  }
}

export interface EventRegistrationSummary {
  registrationId: string;
  /** 'INDIVIDUAL' or 'TEAM'. */
  mode: string;
  /** Team name for teams; the registrant's user id for individuals (until HR/user sync lands). */
  displayName: string;
}

export type GetEventRegistrationsResult = EventRegistrationSummary[];
