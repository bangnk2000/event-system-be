/** Primitives every repository shares. Context-specific ports extend this with finders. */
export interface RepositoryPort<Aggregate> {
  insert(entity: Aggregate): Promise<void>;
  save(entity: Aggregate): Promise<void>;
  findOneById(id: string): Promise<Aggregate | null>;
  delete(entity: Aggregate): Promise<void>;
  /** Id generation belongs to infrastructure, never the domain. */
  nextId(): string;
}
