import 'reflect-metadata';
import { DataSource } from 'typeorm';
// Relative imports (not path aliases) so the TypeORM CLI resolves them without extra registration.
import { EventOrmEntity } from './modules/event/database/event.persistence.model';
import { OutboxMessageOrmEntity } from './libs/outbox/outbox.entity';
import { RegistrationOrmEntity } from './modules/participation/database/registration.persistence.model';
import { BudgetOrmEntity } from './modules/budget/database/budget.persistence.model';
import { NotificationPreferenceOrmEntity } from './modules/notification/database/notification-preference.persistence.model';
import { SurveyOrmEntity } from './modules/survey/database/survey.persistence.model';
import { SurveyResponseOrmEntity } from './modules/survey/database/survey-response.persistence.model';
import { TournamentOrmEntity } from './modules/competition/database/tournament.persistence.model';

/** DataSource used by the TypeORM CLI for migrations (`pnpm migration:run`). */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/event_system',
  entities: [
    EventOrmEntity,
    OutboxMessageOrmEntity,
    RegistrationOrmEntity,
    BudgetOrmEntity,
    NotificationPreferenceOrmEntity,
    SurveyOrmEntity,
    SurveyResponseOrmEntity,
    TournamentOrmEntity,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
