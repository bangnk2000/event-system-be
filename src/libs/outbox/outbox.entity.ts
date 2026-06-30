import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/** Transactional outbox row. Written in the SAME txn as the aggregate; relayed by OutboxRelay. */
@Entity({ name: 'outbox_messages' })
export class OutboxMessageOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId!: string;

  @Column({ name: 'event_name', type: 'varchar', length: 200 })
  eventName!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Index()
  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;
}
