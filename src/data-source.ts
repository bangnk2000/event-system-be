import 'reflect-metadata';
import { DataSource } from 'typeorm';
// Relative imports (not path aliases) so the TypeORM CLI resolves them without extra registration.
import { EventOrmEntity } from './modules/event/database/event.persistence.model';
import { OutboxMessageOrmEntity } from './libs/outbox/outbox.entity';
import { RegistrationOrmEntity } from './modules/participation/database/registration.persistence.model';
import { BudgetOrmEntity } from './modules/budget/database/budget.persistence.model';

/** DataSource used by the TypeORM CLI for migrations (`pnpm migration:run`). */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/event_system',
  entities: [EventOrmEntity, OutboxMessageOrmEntity, RegistrationOrmEntity, BudgetOrmEntity],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
