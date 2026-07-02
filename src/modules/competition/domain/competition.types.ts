export enum TournamentFormat {
  SINGLE_ELIM = 'SINGLE_ELIM',
  ROUND_ROBIN = 'ROUND_ROBIN',
  GROUP_KNOCKOUT = 'GROUP_KNOCKOUT',
}

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  SEEDED = 'SEEDED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** Only meaningful for GROUP_KNOCKOUT; null for the other formats. */
export enum TournamentStage {
  GROUP = 'GROUP',
  KNOCKOUT = 'KNOCKOUT',
}

export enum MatchStatus {
  PENDING = 'PENDING', // not both competitors resolved yet (waiting on a prior round)
  SCHEDULED = 'SCHEDULED', // both competitors known, awaiting a result
  PLAYED = 'PLAYED', // score recorded
  BYE = 'BYE', // one side had no opponent; the present competitor auto-advanced
}

export enum SeedMethod {
  /** Seed order follows the order competitors were added. */
  MANUAL_ORDER = 'MANUAL_ORDER',
}

export interface TournamentConfig {
  /** GROUP_KNOCKOUT only: number of groups. */
  numGroups: number | null;
  /** GROUP_KNOCKOUT only: how many top competitors per group advance to the knockout. */
  advancePerGroup: number | null;
  seedMethod: SeedMethod;
}
