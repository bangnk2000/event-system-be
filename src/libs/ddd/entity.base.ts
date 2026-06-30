import { Guard } from '../guard';
import { ArgumentInvalidException } from '../exceptions';

export type AggregateID = string;

export interface BaseEntityProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntityProps<T> {
  id: string;
  props: T;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class Entity<EntityProps> {
  protected readonly _id: string;
  protected readonly props: EntityProps;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor({ id, createdAt, updatedAt, props }: CreateEntityProps<EntityProps>) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this.props = props;
    this.validate(); // always-valid: invariants checked on construction
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /** Bump updatedAt after a state-changing method; time is provided by the caller. */
  protected setUpdatedAt(now: Date): void {
    this._updatedAt = now;
  }

  /** Frozen snapshot of identity + timestamps + props — the only read surface mappers use. */
  public getProps(): Readonly<EntityProps & BaseEntityProps> {
    return Object.freeze({
      id: this._id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      ...this.props,
    });
  }

  /** Identity equality — never structural. */
  public equals(object?: Entity<EntityProps>): boolean {
    if (object == null || !(object instanceof Entity)) return false;
    if (this === object) return true;
    return this._id === object._id;
  }

  /** Guards every invariant. Throw a technical exception on impossible state. */
  public abstract validate(): void;

  protected guardAgainstEmpty(value: unknown, field: string): void {
    if (Guard.isEmpty(value)) {
      throw new ArgumentInvalidException(`${field} must not be empty`);
    }
  }
}
