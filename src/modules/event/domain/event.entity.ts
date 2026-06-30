import { AggregateRoot } from '@libs/ddd';
import { ArgumentInvalidException } from '@libs/exceptions';
import { EventDraftedDomainEvent } from './events/event-drafted.domain-event';
import { EventStatus } from './value-objects/event-status.value-object';
import { OrganizingCommitteeMember } from './value-objects/organizing-committee-member.value-object';
import { DraftEventProps, EventProps } from './event.types';

/**
 * Event aggregate root. Consistency boundary = the event + its organizing committee.
 * Registrations live in a separate context (Participation) and reference the event by id.
 */
export class EventEntity extends AggregateRoot<EventProps> {
  /** Factory: draft a new event. The creator becomes the committee OWNER. id + now are injected. */
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
