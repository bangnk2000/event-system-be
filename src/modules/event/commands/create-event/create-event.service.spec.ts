import { CreateEventService } from './create-event.service';
import { CreateEventCommand } from './create-event.command';
import { EventRepositoryPort } from '../../application/ports/event.repository.port';
import { EventType } from '../../domain/event.types';
import { RegistrationMode } from '../../domain/value-objects/registration-policy.value-object';

describe('CreateEventService', () => {
  let repo: jest.Mocked<EventRepositoryPort>;
  let service: CreateEventService;

  beforeEach(() => {
    repo = {
      insert: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(),
      findOneById: jest.fn(),
      delete: jest.fn(),
      nextId: jest.fn().mockReturnValue('11111111-1111-1111-1111-111111111111'),
    } as unknown as jest.Mocked<EventRepositoryPort>;
    service = new CreateEventService(repo);
  });

  it('drafts an event and returns its id', async () => {
    const result = await service.execute(
      new CreateEventCommand({
        organizerId: 'user-1',
        titleVi: 'Họp toàn công ty',
        type: EventType.INTERNAL_MEETING,
        startAt: new Date('2026-07-10T02:00:00Z'),
        endAt: new Date('2026-07-10T04:00:00Z'),
        registrationMode: RegistrationMode.INDIVIDUAL,
      }),
    );

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe('11111111-1111-1111-1111-111111111111');
    expect(repo.insert).toHaveBeenCalledTimes(1);
  });

  it('returns Err when the registration deadline is after the start time', async () => {
    const result = await service.execute(
      new CreateEventCommand({
        organizerId: 'user-1',
        titleVi: 'Họp toàn công ty',
        type: EventType.INTERNAL_MEETING,
        startAt: new Date('2026-07-10T02:00:00Z'),
        endAt: new Date('2026-07-10T04:00:00Z'),
        registrationMode: RegistrationMode.INDIVIDUAL,
        registrationDeadline: new Date('2026-07-11T00:00:00Z'),
      }),
    );

    expect(result.isErr()).toBe(true);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('throws ArgumentInvalidException when end time is before start time', async () => {
    await expect(
      service.execute(
        new CreateEventCommand({
          organizerId: 'user-1',
          titleVi: 'Sự kiện lỗi',
          type: EventType.TRAINING,
          startAt: new Date('2026-07-10T04:00:00Z'),
          endAt: new Date('2026-07-10T02:00:00Z'),
          registrationMode: RegistrationMode.INDIVIDUAL,
        }),
      ),
    ).rejects.toThrow();
  });
});
