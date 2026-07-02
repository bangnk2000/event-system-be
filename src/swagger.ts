import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/**
 * Single source of truth for the OpenAPI document. Used by BOTH:
 *   - main.ts        → serve interactive Swagger UI at /docs (for developers)
 *   - scripts/gen-openapi.ts → emit docs/openapi.json (for the FE / AI agents / codegen)
 * so the served docs and the committed spec can never drift apart.
 *
 * NOTE: call this AFTER app.enableVersioning() so operation paths include the `/v1` prefix.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Event System API')
    .setDescription(
      'Internal company event-management backend (NestJS · DDD/Hexagonal · CQRS). ' +
        'Auth: send a Google ID token as `Authorization: Bearer <token>`, or in dev the ' +
        '`x-user-id: <uuid>` header.',
    )
    .setVersion('1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Google ID token.',
      },
      'bearer',
    )
    .addApiKey({ type: 'apiKey', name: 'x-user-id', in: 'header' }, 'x-user-id')
    // Either scheme satisfies the guard (prod Bearer OR dev header) — two requirements = OR.
    .addSecurityRequirements('bearer')
    .addSecurityRequirements('x-user-id')
    .addTag('events', 'Event lifecycle: create, publish, open registration, reschedule, cancel')
    .addTag('participation', 'Registrations: register, cancel, check-in, list')
    .addTag('budget', 'Event budgeting: plan, record actuals, finalize, summary')
    .addTag('notifications', 'Per-user notification preferences (opt in/out by type)')
    .addTag('survey', 'Post-event surveys: create, open/close, submit (anonymous), aggregated results')
    .addTag('competition', 'Sports tournaments: create, seed (elim/round-robin/group→knockout), record results, standings')
    .build();

  return SwaggerModule.createDocument(app, config);
}

/** Mounts the interactive Swagger UI (and raw JSON at /docs-json) on a running app. */
export function setupSwaggerUi(app: INestApplication, document: OpenAPIObject): void {
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: { persistAuthorization: true },
  });
}
