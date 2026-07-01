import { NotificationPreferenceEntity } from './notification-preference.entity';
import { NotificationType } from './notification-preference.types';

const NOW = new Date('2026-07-10T02:00:00Z');
const USER = 'user-1';

describe('NotificationPreferenceEntity', () => {
  it('enables every type by default', () => {
    const pref = NotificationPreferenceEntity.createDefault(USER, NOW);
    expect(pref.isEnabled(NotificationType.REGISTRATION_CANCELLED)).toBe(true);
    expect(pref.disabledTypes).toEqual([]);
  });

  it('opts out of a type and back in', () => {
    const pref = NotificationPreferenceEntity.createDefault(USER, NOW);

    pref.setEnabled(NotificationType.REGISTRATION_CANCELLED, false, NOW);
    expect(pref.isEnabled(NotificationType.REGISTRATION_CANCELLED)).toBe(false);
    expect(pref.disabledTypes).toEqual([NotificationType.REGISTRATION_CANCELLED]);

    pref.setEnabled(NotificationType.REGISTRATION_CANCELLED, true, NOW);
    expect(pref.isEnabled(NotificationType.REGISTRATION_CANCELLED)).toBe(true);
    expect(pref.disabledTypes).toEqual([]);
  });

  it('does not duplicate a disabled type when opting out twice', () => {
    const pref = NotificationPreferenceEntity.createDefault(USER, NOW);
    pref.setEnabled(NotificationType.REGISTRATION_CANCELLED, false, NOW);
    pref.setEnabled(NotificationType.REGISTRATION_CANCELLED, false, NOW);
    expect(pref.disabledTypes).toEqual([NotificationType.REGISTRATION_CANCELLED]);
  });
});
