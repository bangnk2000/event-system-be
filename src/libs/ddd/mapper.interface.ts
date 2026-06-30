/** The single translation point between domain entity, DB row, and Response DTO. */
export interface Mapper<DomainEntity, Persistence, Response = unknown> {
  toDomain(record: Persistence): DomainEntity;
  toPersistence(entity: DomainEntity): Persistence;
  toResponse(entity: DomainEntity): Response;
}
