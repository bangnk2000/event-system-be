import { MultilingualText } from './value-objects/multilingual-text.value-object';
import { DateTimeRange } from './value-objects/date-time-range.value-object';
import { EventStatus } from './value-objects/event-status.value-object';
import { RegistrationPolicy } from './value-objects/registration-policy.value-object';
import { OrganizingCommitteeMember } from './value-objects/organizing-committee-member.value-object';

export enum EventType {
  INTERNAL_MEETING = 'INTERNAL_MEETING',
  TRAINING = 'TRAINING',
  TEAM_BUILDING = 'TEAM_BUILDING',
  TRAVEL = 'TRAVEL',
  // SPORTS is added in Phase 2 (tournament context).
}

export interface EventLocation {
  kind: 'ONLINE' | 'OFFLINE';
  address?: string;
  url?: string;
}

export interface EventProps {
  title: MultilingualText;
  description: MultilingualText | null;
  type: EventType;
  status: EventStatus;
  schedule: DateTimeRange;
  location: EventLocation | null;
  capacity: number | null;
  registrationPolicy: RegistrationPolicy;
  committee: OrganizingCommitteeMember[];
}

/** Inputs to draft a brand-new event (id + timestamps are injected by the application layer). */
export interface DraftEventProps {
  title: MultilingualText;
  description?: MultilingualText | null;
  type: EventType;
  schedule: DateTimeRange;
  location?: EventLocation | null;
  capacity?: number | null;
  registrationPolicy: RegistrationPolicy;
}
