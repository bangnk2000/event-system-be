import { RepositoryPort } from '@libs/ddd';
import { RegistrationEntity } from '../../domain/registration.entity';

export const REGISTRATION_REPOSITORY = Symbol('REGISTRATION_REPOSITORY');

export interface RegistrationRepositoryPort extends RepositoryPort<RegistrationEntity> {
  findActiveByEventAndUser(eventId: string, userId: string): Promise<RegistrationEntity | null>;
}
