import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { validateConfig } from '@libs/config/config.schema';
import { LoggerModule } from '@libs/logger/logger.module';
import { OutboxModule } from '@libs/outbox/outbox.module';
import { AuthModule } from '@libs/auth/auth.module';
import { DatabaseModule } from './database.module';
import { EventModule } from '@modules/event/event.module';
import { ParticipationModule } from '@modules/participation/participation.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { BudgetModule } from '@modules/budget/budget.module';
import { SurveyModule } from '@modules/survey/survey.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    LoggerModule,
    AuthModule,
    DatabaseModule,
    OutboxModule,
    EventModule,
    ParticipationModule,
    NotificationModule,
    BudgetModule,
    SurveyModule,
  ],
})
export class AppModule {}
