import { EventEntity } from './event.entity';
import { MultilingualText } from './value-objects/multilingual-text.value-object';
import { DateTimeRange } from './value-objects/date-time-range.value-object';
import {
  RegistrationMode,
  RegistrationPolicy,
} from './value-objects/registration-policy.value-object';
import { EventType } from './event.types';
import { EventStatusEnum } from './value-objects/event-status.value-object';

const NOW = new Date('2026-06-30T00:00:00Z');

function draftEvent(): EventEntity {
  return EventEntity.draft(
    {
      title: MultilingualText.create('Họp toàn công ty'),
      type: EventType.INTERNAL_MEETING,
      schedule: DateTimeRange.create(
        new Date('2026-07-10T02:00:00Z'),
        new Date('2026-07-10T04:00:00Z'),
      ),
      registrationPolicy: RegistrationPolicy.create(RegistrationMode.INDIVIDUAL),
    },
    'owner-1',
    'evt-1',
    NOW,
  );
}

const eventNames = (e: EventEntity): string[] => e.domainEvents.map((ev) => ev.constructor.name);

describe('EventEntity lifecycle', () => {
  it('publishes from draft and emits EventPublished', () => {
    const event = draftEvent();
    event.clearEvents();
    expect(event.publish(NOW).isOk()).toBe(true);
    expect(event.status.value).toBe(EventStatusEnum.PUBLISHED);
    expect(eventNames(event)).toContain('EventPublishedDomainEvent');
  });

  it('rejects publishing twice', () => {
    const event = draftEvent();
    event.publish(NOW);
    expect(event.publish(NOW).isErr()).toBe(true);
  });

  it('auto closes + reopens registration on reschedule while open', () => {
    const event = draftEvent();
    event.publish(NOW);
    event.openRegistration(NOW);
    event.clearEvents();

    const result = event.reschedule(
      DateTimeRange.create(new Date('2026-08-01T02:00:00Z'), new Date('2026-08-01T04:00:00Z')),
      NOW,
    );

    expect(result.isOk()).toBe(true);
    expect(event.status.value).toBe(EventStatusEnum.REGISTRATION_OPEN);
    expect(eventNames(event)).toEqual([
      'EventRescheduledDomainEvent',
      'RegistrationClosedDomainEvent',
      'RegistrationReopenedDomainEvent',
    ]);
  });

  it('cancels once, then rejects a second cancel', () => {
    const event = draftEvent();
    expect(event.cancel('duplicate venue', NOW).isOk()).toBe(true);
    expect(event.status.value).toBe(EventStatusEnum.CANCELLED);
    expect(event.cancel('again', NOW).isErr()).toBe(true);
  });
});
