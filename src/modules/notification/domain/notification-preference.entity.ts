import { AggregateRoot } from '@libs/ddd';
import { NotificationPreferenceProps, NotificationType } from './notification-preference.types';

/**
 * A user's notification preferences (context: Notification). Keyed by the user id itself
 * (the aggregate id IS the userId) — one row per user. Opt-out model: a type is enabled
 * unless the user has explicitly disabled it, so a user with no stored row receives everything.
 * References the user by id only; it never imports an `iam`/user module.
 */
export class NotificationPreferenceEntity extends AggregateRoot<NotificationPreferenceProps> {
  /** A fresh preference set for a user who has never changed any setting (all enabled). */
  static createDefault(userId: string, now: Date): NotificationPreferenceEntity {
    return new NotificationPreferenceEntity({
      id: userId,
      createdAt: now,
      updatedAt: now,
      props: { disabledTypes: [] },
    });
  }

  get userId(): string {
    return this.id;
  }

  get disabledTypes(): NotificationType[] {
    return [...this.props.disabledTypes];
  }

  isEnabled(type: NotificationType): boolean {
    return !this.props.disabledTypes.includes(type);
  }

  /** Idempotent: only bumps updatedAt when the flag actually changes. */
  setEnabled(type: NotificationType, enabled: boolean, now: Date): void {
    const currentlyDisabled = this.props.disabledTypes.includes(type);
    if (enabled && currentlyDisabled) {
      this.props.disabledTypes = this.props.disabledTypes.filter((t) => t !== type);
      this.setUpdatedAt(now);
    } else if (!enabled && !currentlyDisabled) {
      this.props.disabledTypes = [...this.props.disabledTypes, type];
      this.setUpdatedAt(now);
    }
  }

  public validate(): void {
    this.guardAgainstEmpty(this.id, 'userId');
  }
}
