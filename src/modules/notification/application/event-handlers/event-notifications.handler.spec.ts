import { EventNotificationsHandler } from './event-notifications.handler';
import { NotifierPort } from '../ports/notifier.port';
import { NotificationPreferenceRepositoryPort } from '../ports/notification-preference.repository.port';
import { NotificationPreferenceEntity } from '../../domain/notification-preference.entity';
import { NotificationType } from '../../domain/notification-preference.types';

const NOW = new Date('2026-07-10T02:00:00Z');
const USER = '33333333-3333-3333-3333-333333333333';
const EVENT = '11111111-1111-1111-1111-111111111111';

function setup(preference: NotificationPreferenceEntity | null) {
  const notify = jest.fn().mockResolvedValue(undefined);
  const notifier: NotifierPort = { notify };
  const preferences = {
    findOneById: jest.fn().mockResolvedValue(preference),
  } as unknown as NotificationPreferenceRepositoryPort;
  return { handler: new EventNotificationsHandler(notifier, preferences), notify };
}

describe('EventNotificationsHandler — registration cancelled', () => {
  const payload = { aggregateId: 'reg-1', eventId: EVENT, userId: USER };

  it('notifies both the organizers and the registrant by default (no stored preference)', async () => {
    const { handler, notify } = setup(null);
    await handler.onRegistrationCancelled(payload);
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it('still notifies organizers but skips the registrant when they opted out', async () => {
    const pref = NotificationPreferenceEntity.createDefault(USER, NOW);
    pref.setEnabled(NotificationType.REGISTRATION_CANCELLED, false, NOW);
    const { handler, notify } = setup(pref);

    await handler.onRegistrationCancelled(payload);

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0]).toContain('đã hủy đăng ký');
  });
});
