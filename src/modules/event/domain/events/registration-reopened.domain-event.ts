import { DomainEvent } from '@libs/ddd';

/** Emitted when a reschedule auto-closes and reopens an already-open registration window. */
export class RegistrationReopenedDomainEvent extends DomainEvent {}
