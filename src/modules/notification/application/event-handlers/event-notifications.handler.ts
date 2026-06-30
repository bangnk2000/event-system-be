import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NOTIFIER, NotifierPort } from '../ports/notifier.port';

/**
 * Reacts to domain events RELAYED by the outbox (OutboxRelay emits them on EventEmitter2 by name).
 * Cross-context by event-name string only — this module imports neither `event` nor `participation`,
 * so module privacy holds (dependency-cruiser enforces it).
 */
@Injectable()
export class EventNotificationsHandler {
  constructor(@Inject(NOTIFIER) private readonly notifier: NotifierPort) {}

  @OnEvent('EventPublishedDomainEvent')
  async onEventPublished(payload: { aggregateId: string }): Promise<void> {
    await this.notifier.notify(`📢 Sự kiện mới đã được công bố (id: ${payload.aggregateId})`);
  }

  @OnEvent('EventCancelledDomainEvent')
  async onEventCancelled(payload: { aggregateId: string; reason?: string }): Promise<void> {
    await this.notifier.notify(`⚠️ Sự kiện ${payload.aggregateId} đã bị hủy: ${payload.reason ?? ''}`);
  }

  @OnEvent('ParticipantRegisteredDomainEvent')
  async onParticipantRegistered(payload: { eventId: string; userId: string }): Promise<void> {
    await this.notifier.notify(`✅ ${payload.userId} đã đăng ký sự kiện ${payload.eventId}`);
  }
}
