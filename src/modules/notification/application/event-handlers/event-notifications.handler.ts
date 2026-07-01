import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NOTIFIER, NotifierPort } from '../ports/notifier.port';
import {
  NOTIFICATION_PREFERENCE_REPOSITORY,
  NotificationPreferenceRepositoryPort,
} from '../ports/notification-preference.repository.port';
import { NotificationType } from '../../domain/notification-preference.types';

/**
 * Reacts to domain events RELAYED by the outbox (OutboxRelay emits them on EventEmitter2 by name).
 * Cross-context by event-name string only — this module imports neither `event` nor `participation`,
 * so module privacy holds (dependency-cruiser enforces it).
 */
@Injectable()
export class EventNotificationsHandler {
  constructor(
    @Inject(NOTIFIER) private readonly notifier: NotifierPort,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferences: NotificationPreferenceRepositoryPort,
  ) {}

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

  @OnEvent('RegistrationCancelledDomainEvent')
  async onRegistrationCancelled(payload: {
    aggregateId: string;
    eventId: string;
    userId: string;
  }): Promise<void> {
    // The organizers' channel (shared room) is always informed so they can track headcount.
    await this.notifier.notify(`❌ ${payload.userId} đã hủy đăng ký sự kiện ${payload.eventId}`);

    // The registrant gets a personal confirmation only if they haven't opted out of this type.
    if (await this.isEnabled(payload.userId, NotificationType.REGISTRATION_CANCELLED)) {
      await this.notifier.notify(
        `ℹ️ Bạn (${payload.userId}) đã hủy đăng ký sự kiện ${payload.eventId} thành công.`,
      );
    }
  }

  /** Opt-out model: no stored preference row ⇒ enabled. */
  private async isEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const pref = await this.preferences.findOneById(userId);
    return pref ? pref.isEnabled(type) : true;
  }
}
