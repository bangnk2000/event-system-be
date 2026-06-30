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

/** Allowed forward transitions. reschedule keeps the same status (handled in the aggregate). */
const TRANSITIONS: Record<EventStatusEnum, EventStatusEnum[]> = {
  [EventStatusEnum.DRAFT]: [EventStatusEnum.PUBLISHED, EventStatusEnum.CANCELLED],
  [EventStatusEnum.PUBLISHED]: [
    EventStatusEnum.REGISTRATION_OPEN,
    EventStatusEnum.ONGOING,
    EventStatusEnum.CANCELLED,
  ],
  [EventStatusEnum.REGISTRATION_OPEN]: [
    EventStatusEnum.REGISTRATION_CLOSED,
    EventStatusEnum.ONGOING,
    EventStatusEnum.CANCELLED,
  ],
  [EventStatusEnum.REGISTRATION_CLOSED]: [
    EventStatusEnum.REGISTRATION_OPEN,
    EventStatusEnum.ONGOING,
    EventStatusEnum.CANCELLED,
  ],
  [EventStatusEnum.ONGOING]: [EventStatusEnum.COMPLETED, EventStatusEnum.CANCELLED],
  [EventStatusEnum.COMPLETED]: [],
  [EventStatusEnum.CANCELLED]: [],
};

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

  canTransitionTo(target: EventStatusEnum): boolean {
    return TRANSITIONS[this.value].includes(target);
  }

  static draft(): EventStatus {
    return new EventStatus({ value: EventStatusEnum.DRAFT });
  }

  /** Reconstitution / explicit transition target (no checks — the aggregate guards transitions). */
  static of(value: string): EventStatus {
    return new EventStatus({ value });
  }
}
