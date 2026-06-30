import { Err, Ok, Result } from 'oxide.ts';
import { AggregateRoot } from '@libs/ddd';
import { ArgumentInvalidException } from '@libs/exceptions';
import { EventDraftedDomainEvent } from './events/event-drafted.domain-event';
import { EventPublishedDomainEvent } from './events/event-published.domain-event';
import { RegistrationOpenedDomainEvent } from './events/registration-opened.domain-event';
import { RegistrationClosedDomainEvent } from './events/registration-closed.domain-event';
import { RegistrationReopenedDomainEvent } from './events/registration-reopened.domain-event';
import { EventRescheduledDomainEvent } from './events/event-rescheduled.domain-event';
import { EventCancelledDomainEvent } from './events/event-cancelled.domain-event';
import { InvalidEventScheduleError, InvalidEventStateError } from './event.errors';
import { EventStatus, EventStatusEnum } from './value-objects/event-status.value-object';
import { DateTimeRange } from './value-objects/date-time-range.value-object';
import { OrganizingCommitteeMember } from './value-objects/organizing-committee-member.value-object';
import { DraftEventProps, EventProps } from './event.types';

/**
 * Event aggregate root. Consistency boundary = the event + its organizing committee.
 * Registrations live in a separate context (Participation) and reference the event by id.
 *
 * State machine: DRAFT → PUBLISHED → REGISTRATION_OPEN ⇄ REGISTRATION_CLOSED → ONGOING → COMPLETED;
 * any non-terminal state → CANCELLED. Business-rule violations are RETURNED as Result.
 */
export class EventEntity extends AggregateRoot<EventProps> {
  static draft(props: DraftEventProps, creatorId: string, id: string, now: Date): EventEntity {
    const committee = [OrganizingCommitteeMember.owner(creatorId)];

    const event = new EventEntity({
      id,
      createdAt: now,
      updatedAt: now,
      props: {
        title: props.title,
        description: props.description ?? null,
        type: props.type,
        status: EventStatus.draft(),
        schedule: props.schedule,
        location: props.location ?? null,
        capacity: props.capacity ?? null,
        registrationPolicy: props.registrationPolicy,
        committee,
      },
    });

    event.addEvent(
      new EventDraftedDomainEvent({ aggregateId: id, creatorId, title: props.title.vi }),
    );
    return event;
  }

  get status(): EventStatus {
    return this.props.status;
  }

  get committee(): readonly OrganizingCommitteeMember[] {
    return this.props.committee;
  }

  isOrganizer(userId: string): boolean {
    return this.props.committee.some((m) => m.userId === userId);
  }

  publish(now: Date): Result<void, InvalidEventStateError> {
    if (!this.props.status.canTransitionTo(EventStatusEnum.PUBLISHED)) {
      return Err(new InvalidEventStateError('publish', this.props.status.value));
    }
    this.props.status = EventStatus.of(EventStatusEnum.PUBLISHED);
    this.setUpdatedAt(now);
    this.addEvent(new EventPublishedDomainEvent({ aggregateId: this.id }));
    return Ok(undefined);
  }

  openRegistration(now: Date): Result<void, InvalidEventStateError> {
    if (!this.props.status.canTransitionTo(EventStatusEnum.REGISTRATION_OPEN)) {
      return Err(new InvalidEventStateError('open registration for', this.props.status.value));
    }
    this.props.status = EventStatus.of(EventStatusEnum.REGISTRATION_OPEN);
    this.setUpdatedAt(now);
    this.addEvent(new RegistrationOpenedDomainEvent({ aggregateId: this.id }));
    return Ok(undefined);
  }

  closeRegistration(now: Date): Result<void, InvalidEventStateError> {
    if (!this.props.status.canTransitionTo(EventStatusEnum.REGISTRATION_CLOSED)) {
      return Err(new InvalidEventStateError('close registration for', this.props.status.value));
    }
    this.props.status = EventStatus.of(EventStatusEnum.REGISTRATION_CLOSED);
    this.setUpdatedAt(now);
    this.addEvent(new RegistrationClosedDomainEvent({ aggregateId: this.id }));
    return Ok(undefined);
  }

  /**
   * Move the event to a new schedule. If registration is currently OPEN, auto close + reopen it so
   * registrants are re-notified and the window resets (decision: reschedule auto close/reopen = yes).
   */
  reschedule(
    newRange: DateTimeRange,
    now: Date,
  ): Result<void, InvalidEventStateError | InvalidEventScheduleError> {
    if (this.props.status.isTerminal()) {
      return Err(new InvalidEventStateError('reschedule', this.props.status.value));
    }
    const deadline = this.props.registrationPolicy.deadline;
    if (deadline && deadline.getTime() > newRange.startAt.getTime()) {
      return Err(new InvalidEventScheduleError());
    }

    const wasRegistrationOpen = this.props.status.is(EventStatusEnum.REGISTRATION_OPEN);
    this.props.schedule = newRange;
    this.setUpdatedAt(now);
    this.addEvent(
      new EventRescheduledDomainEvent({
        aggregateId: this.id,
        startAt: newRange.startAt,
        endAt: newRange.endAt,
      }),
    );

    if (wasRegistrationOpen) {
      // status stays REGISTRATION_OPEN; the close+reopen pair signals downstream to re-notify.
      this.addEvent(new RegistrationClosedDomainEvent({ aggregateId: this.id }));
      this.addEvent(new RegistrationReopenedDomainEvent({ aggregateId: this.id }));
    }
    return Ok(undefined);
  }

  cancel(reason: string, now: Date): Result<void, InvalidEventStateError> {
    if (this.props.status.isTerminal()) {
      return Err(new InvalidEventStateError('cancel', this.props.status.value));
    }
    this.props.status = EventStatus.of(EventStatusEnum.CANCELLED);
    this.setUpdatedAt(now);
    this.addEvent(new EventCancelledDomainEvent({ aggregateId: this.id, reason }));
    return Ok(undefined);
  }

  public validate(): void {
    this.guardAgainstEmpty(this.props.title, 'title');
    if (this.props.committee.length === 0) {
      throw new ArgumentInvalidException(
        'Event must have at least one organizing committee member',
      );
    }
    if (this.props.capacity !== null && this.props.capacity <= 0) {
      throw new ArgumentInvalidException('Capacity, when set, must be greater than 0');
    }
  }
}
