/**
 * Small, dependency-free invariant guards used inside value-object / entity constructors.
 * A failed guard throws ArgumentInvalidException at the construction boundary (technical fault);
 * higher-level business rules are returned as Result instead.
 */
export class Guard {
  static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  static lengthIsBetween(value: string, min: number, max: number): boolean {
    const n = value.trim().length;
    return n >= min && n <= max;
  }
}
