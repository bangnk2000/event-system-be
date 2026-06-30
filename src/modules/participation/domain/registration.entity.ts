import { Err, Ok, Result } from 'oxide.ts';
import { AggregateRoot } from '@libs/ddd';
import { ArgumentInvalidException } from '@libs/exceptions';
import { ParticipantRegisteredDomainEvent } from './events/participant-registered.domain-event';
import { RegistrationCancelledDomainEvent } from './events/registration-cancelled.domain-event';
import { ParticipantCheckedInDomainEvent } from './events/participant-checked-in.domain-event';
import { AlreadyCheckedInError, RegistrationNotActiveError } from './registration.errors';
import {
  ParticipationMode,
  RegisterProps,
  RegistrationProps,
  RegistrationStatus,
} from './registration.types';

/**
 * Registration aggregate (context: Participation). References the event by id only — it never
 * imports the `event` module. Checking the event is open is a follow-up (via the query bus).
 */
export class RegistrationEntity extends AggregateRoot<RegistrationProps> {
  static register(props: RegisterProps, id: string, now: Date): RegistrationEntity {
    const registration = new RegistrationEntity({
      id,
      createdAt: now,
      updatedAt: now,
      props: {
        eventId: props.eventId,
        mode: props.mode,
        userId: props.userId,
        teamName: props.teamName ?? null,
        memberIds: props.memberIds ?? [],
        status: RegistrationStatus.REGISTERED,
        checkedInAt: null,
      },
    });
    registration.addEvent(
      new ParticipantRegisteredDomainEvent({
        aggregateId: id,
        eventId: props.eventId,
        userId: props.userId,
        mode: props.mode,
      }),
    );
    return registration;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get status(): RegistrationStatus {
    return this.props.status;
  }

  isCheckedIn(): boolean {
    return this.props.checkedInAt !== null;
  }

  cancel(now: Date): Result<void, RegistrationNotActiveError> {
    if (this.props.status !== RegistrationStatus.REGISTERED) {
      return Err(new RegistrationNotActiveError());
    }
    this.props.status = RegistrationStatus.CANCELLED;
    this.setUpdatedAt(now);
    this.addEvent(
      new RegistrationCancelledDomainEvent({ aggregateId: this.id, eventId: this.props.eventId }),
    );
    return Ok(undefined);
  }

  checkIn(now: Date): Result<void, RegistrationNotActiveError | AlreadyCheckedInError> {
    if (this.props.status !== RegistrationStatus.REGISTERED) {
      return Err(new RegistrationNotActiveError());
    }
    if (this.props.checkedInAt !== null) {
      return Err(new AlreadyCheckedInError());
    }
    this.props.checkedInAt = now;
    this.setUpdatedAt(now);
    this.addEvent(
      new ParticipantCheckedInDomainEvent({
        aggregateId: this.id,
        eventId: this.props.eventId,
        userId: this.props.userId,
      }),
    );
    return Ok(undefined);
  }

  public validate(): void {
    this.guardAgainstEmpty(this.props.eventId, 'eventId');
    this.guardAgainstEmpty(this.props.userId, 'userId');
    if (
      this.props.mode === ParticipationMode.TEAM &&
      (this.props.teamName === null || this.props.teamName.trim() === '')
    ) {
      throw new ArgumentInvalidException('Team registration requires a team name');
    }
  }
}
