import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/libs/exceptions/exception.filter';

export interface TestContext {
  app: INestApplication;
  dataSource: DataSource;
}

/** Boots the full Nest app exactly like main.ts (versioning + validation + global filter). */
export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();
  return { app, dataSource: app.get(DataSource) };
}

export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    'TRUNCATE TABLE "registrations", "budgets", "events", "outbox_messages", "notification_preferences", "survey_responses", "surveys" RESTART IDENTITY CASCADE',
  );
}

export async function closeTestApp(ctx: TestContext): Promise<void> {
  await ctx.app.close();
  if (ctx.dataSource.isInitialized) await ctx.dataSource.destroy();
}
