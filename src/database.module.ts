import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { OutboxMessageOrmEntity } from '@libs/outbox/outbox.entity';
import { EventOrmEntity } from '@modules/event/database/event.persistence.model';
import { RegistrationOrmEntity } from '@modules/participation/database/registration.persistence.model';
import { BudgetOrmEntity } from '@modules/budget/database/budget.persistence.model';
import { NotificationPreferenceOrmEntity } from '@modules/notification/database/notification-preference.persistence.model';

/**
 * Composition-root database wiring (NOT under libs/ — it is allowed to know the concrete entities).
 * Provides a single initialized TypeORM DataSource, injected by repositories and the outbox relay.
 * `synchronize` is on only in development for fast iteration; prod uses migrations.
 */
@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useFactory: async (config: ConfigService): Promise<DataSource> => {
        const dataSource = new DataSource({
          type: 'postgres',
          url: config.getOrThrow<string>('DATABASE_URL'),
          entities: [
            EventOrmEntity,
            OutboxMessageOrmEntity,
            RegistrationOrmEntity,
            BudgetOrmEntity,
            NotificationPreferenceOrmEntity,
          ],
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          logging: false,
        });
        await dataSource.initialize();
        return dataSource;
      },
      inject: [ConfigService],
    },
  ],
  exports: [DataSource],
})
export class DatabaseModule {}
