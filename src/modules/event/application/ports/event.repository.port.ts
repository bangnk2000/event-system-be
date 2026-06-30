import { RepositoryPort } from '@libs/ddd';
import { EventEntity } from '../../domain/event.entity';

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');

/** Context-specific finders (e.g. findUpcoming) are added here as use cases need them. */
export type EventRepositoryPort = RepositoryPort<EventEntity>;
