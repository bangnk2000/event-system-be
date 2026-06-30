export type Primitives = string | number | boolean;

export interface DomainPrimitive<T extends Primitives | Date> {
  value: T;
}

type ValueObjectProps<T> = T extends Primitives | Date ? DomainPrimitive<T> : T;

/**
 * A concept with no identity, compared by value. Immutable, self-validating, replaceable.
 * Use only for primitives with real rules (YAGNI — do not wrap every string).
 */
export abstract class ValueObject<T> {
  protected readonly props: ValueObjectProps<T>;

  constructor(props: ValueObjectProps<T>) {
    this.validate(props); // immutable + always-valid
    this.props = props;
  }

  protected abstract validate(props: ValueObjectProps<T>): void;

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) return false;
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }

  public unpack(): T {
    if (this.isDomainPrimitive(this.props)) {
      return this.props.value;
    }
    return Object.freeze({ ...(this.props as object) }) as T;
  }

  private isDomainPrimitive(
    obj: unknown,
  ): obj is DomainPrimitive<T & (Primitives | Date)> {
    return Object.prototype.hasOwnProperty.call(obj, 'value');
  }
}
