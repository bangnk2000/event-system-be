import { RegistrationEntity } from './registration.entity';
import { ParticipationMode } from './registration.types';

const NOW = new Date('2026-07-10T02:00:00Z');

function register(): RegistrationEntity {
  return RegistrationEntity.register(
    { eventId: 'evt-1', mode: ParticipationMode.INDIVIDUAL, userId: 'user-1' },
    'reg-1',
    NOW,
  );
}

describe('RegistrationEntity', () => {
  it('registers and checks in once', () => {
    const reg = register();
    expect(reg.checkIn(NOW).isOk()).toBe(true);
    expect(reg.isCheckedIn()).toBe(true);
  });

  it('rejects a second check-in', () => {
    const reg = register();
    reg.checkIn(NOW);
    expect(reg.checkIn(NOW).isErr()).toBe(true);
  });

  it('cannot check in a cancelled registration', () => {
    const reg = register();
    expect(reg.cancel(NOW).isOk()).toBe(true);
    expect(reg.checkIn(NOW).isErr()).toBe(true);
  });
});
