import { RepositoryPort } from '@libs/ddd';
import { NotificationPreferenceEntity } from '../../domain/notification-preference.entity';

export const NOTIFICATION_PREFERENCE_REPOSITORY = Symbol('NOTIFICATION_PREFERENCE_REPOSITORY');

/**
 * Keyed by userId (= the aggregate id), so the base `findOneById(userId)` is the natural lookup —
 * no extra finder needed.
 */
export type NotificationPreferenceRepositoryPort = RepositoryPort<NotificationPreferenceEntity>;
