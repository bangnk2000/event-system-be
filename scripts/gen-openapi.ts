/**
 * Emits docs/openapi.json — the machine-readable HTTP contract the frontend / AI agents /
 * client codegen consume WITHOUT reading backend code or running a live server.
 *
 * Runs the app in Nest "preview" mode: the module graph is scanned for route metadata but
 * providers are NOT instantiated, so there is no database/network connection. Deterministic
 * output (stable key order + 2-space indent) so `openapi:check` can diff it in CI.
 *
 * Run: `pnpm openapi:gen`. Regenerate after changing any controller/DTO; CI checks it is fresh.
 */
import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { buildOpenApiDocument } from '../src/swagger';

// Preview mode never connects, but ConfigModule still validates env — give it a valid dummy URL.
process.env.DATABASE_URL ??= 'postgres://preview:preview@localhost:5432/preview';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  app.enableVersioning({ type: VersioningType.URI });

  const document = buildOpenApiDocument(app);
  const outPath = join(__dirname, '..', 'docs', 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2) + '\n');

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI spec written to ${outPath}`);
}

void main();
