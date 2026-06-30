/** Participation context owns its OWN mode enum (no cross-module import from `event`). */
export enum ParticipationMode {
  INDIVIDUAL = 'INDIVIDUAL',
  TEAM = 'TEAM',
}

export enum RegistrationStatus {
  REGISTERED = 'REGISTERED',
  CANCELLED = 'CANCELLED',
}

export interface RegistrationProps {
  eventId: string;
  mode: ParticipationMode;
  userId: string; // individual registrant, or the team captain
  teamName: string | null;
  memberIds: string[]; // team members; empty for individual
  status: RegistrationStatus;
  checkedInAt: Date | null;
}

export interface RegisterProps {
  eventId: string;
  mode: ParticipationMode;
  userId: string;
  teamName?: string | null;
  memberIds?: string[];
}
