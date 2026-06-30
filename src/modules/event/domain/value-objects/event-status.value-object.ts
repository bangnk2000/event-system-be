import { DomainPrimitive, ValueObject } from '@libs/ddd';
import { ArgumentInvalidException } from '@libs/exceptions';

export enum EventStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Self-validating status VO. The fuller state machine (publish/openRegistration/reschedule/cancel
 * with auto close+reopen on reschedule) is documented in the design doc and added with those slices;
 * the walking skeleton only needs draft() + reconstitution.
 */
export class EventStatus extends ValueObject<string> {
  protected validate({ value }: DomainPrimitive<string>): void {
    if (!Object.values(EventStatusEnum).includes(value as EventStatusEnum)) {
      throw new ArgumentInvalidException(`Invalid event status: ${value}`);
    }
  }

  get value(): EventStatusEnum {
    return this.props.value as EventStatusEnum;
  }

  is(status: EventStatusEnum): boolean {
    return this.value === status;
  }

  isTerminal(): boolean {
    return this.value === EventStatusEnum.COMPLETED || this.value === EventStatusEnum.CANCELLED;
  }

  static draft(): EventStatus {
    return new EventStatus({ value: EventStatusEnum.DRAFT });
  }

  /** Reconstitution from persistence (no transition checks). */
  static of(value: string): EventStatus {
    return new EventStatus({ value });
  }
}
