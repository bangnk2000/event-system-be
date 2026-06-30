import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { BudgetStatus } from '../domain/budget.types';

export interface BudgetItemRow {
  itemId: string;
  name: string;
  category: string;
  plannedAmount: number;
  actualAmount: number;
  invoiceUrl: string | null;
}

@Entity({ name: 'budgets' })
export class BudgetOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index({ unique: true }) // one budget per event
  @Column({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: BudgetStatus;

  @Column({ type: 'jsonb' })
  items!: BudgetItemRow[];

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
