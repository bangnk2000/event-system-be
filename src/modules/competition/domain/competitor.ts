/**
 * A contestant in a tournament (internal to the Tournament aggregate). Derived from a `participation`
 * registration — we snapshot `displayName` at add time so reading a bracket never calls participation.
 * Immutable — group assignment returns a new instance.
 */
export class Competitor {
  constructor(
    readonly competitorId: string,
    readonly registrationId: string,
    readonly seed: number,
    readonly displayName: string,
    readonly groupLabel: string | null,
  ) {}

  withGroup(groupLabel: string): Competitor {
    return new Competitor(
      this.competitorId,
      this.registrationId,
      this.seed,
      this.displayName,
      groupLabel,
    );
  }
}
