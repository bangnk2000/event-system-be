import { QueryBase } from '@libs/ddd';

/**
 * Shared contract (libs/contracts) so the `participation` context can ask the `event` context whether
 * an event is currently accepting registrations — over the QueryBus, without importing event internals.
 * Same loose-coupling rationale as IsEventOrganizerQuery: both sides import this libs file, not each other.
 */
export class IsEventOpenForRegistrationQuery extends QueryBase {
  readonly eventId: string;

  constructor(props: { eventId: string }) {
    super();
    this.eventId = props.eventId;
  }
}

export interface IsEventOpenForRegistrationResult {
  eventExists: boolean;
  /** true only when the event is in REGISTRATION_OPEN. */
  isOpen: boolean;
}
