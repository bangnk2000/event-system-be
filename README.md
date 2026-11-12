# event-system-be

[![CI](https://github.com/bangnk2000/event-system-be/actions/workflows/ci.yml/badge.svg)](https://github.com/bangnk2000/event-system-be/actions/workflows/ci.yml)

Backend for managing internal company events: event lifecycle, registration and check-in, budgets,
post-event surveys, sports tournaments and chat notifications.

This is a side project based on a use case from work. I use it to try out hexagonal architecture,
DDD and the outbox pattern on something bigger than a todo app.

Vietnamese README: [README.vi.md](README.vi.md). The SRS and design notes in `docs/` are also in Vietnamese.

**Stack:** NestJS 11, TypeScript, PostgreSQL 16, TypeORM, Jest, supertest, GitHub Actions

## Getting started

You need Node 20+ (22 recommended), pnpm and Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d     # postgres on :5432
pnpm migration:run
pnpm start:dev           # http://localhost:3000, Swagger UI is on in dev
```

Auth uses Google ID tokens when `GOOGLE_CLIENT_ID` is set. Locally you can leave it empty and send an
`x-user-id` header instead:

```bash
curl -X POST http://localhost:3000/v1/events \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: 11111111-1111-1111-1111-111111111111' \
  -d '{"titleVi":"All-hands","type":"INTERNAL_MEETING","startAt":"2026-07-10T02:00:00.000Z","endAt":"2026-07-10T04:00:00.000Z","registrationMode":"INDIVIDUAL"}'
```

[`api.http`](api.http) has a full request chain (create event → publish → register → check in → budget)
for the VS Code REST Client or the JetBrains HTTP client. The OpenAPI spec is in
[`docs/openapi.json`](docs/openapi.json).

## Modules

| Module | What it does |
|---|---|
| `event` | create, publish, open registration, reschedule, cancel, summary report |
| `participation` | individual/team registration, check-in, cancellation |
| `budget` | budget items, planned vs. actual, finalize |
| `notification` | user preferences, sends ChatWork messages on domain events |
| `survey` | anonymous post-event surveys |
| `competition` | knockout, round-robin and group → knockout tournaments |

Each module looks roughly like this:

```
src/modules/event/
  domain/          aggregate, value objects, domain events (no Nest/TypeORM imports)
  commands/        one folder per use case: controller, request DTO, command, service
  queries/         read side, one folder per query, reads the tables directly
  application/     ports (e.g. the repository interface)
  database/        persistence model, repository implementation, mapper
```

## Design notes

- **Module boundaries.** Modules don't import each other. They talk through command/query contracts in
  `src/libs/contracts/` or by reacting to domain events. dependency-cruiser and ESLint check this in CI,
  together with the rule that `domain/` stays free of framework code.
- **Read/write split.** Writes go through the aggregate and its repository. Reads skip the domain layer
  and query the tables directly. It all runs on one database, so there is no separate read store.
- **Outbox.** Domain events are saved to `outbox_messages` in the same transaction as the aggregate.
  `OutboxRelay` polls every 5 seconds (batches of 50) and publishes them in-process through
  `EventEmitter2`. The `notification` module subscribes by event name.
- **Anonymous surveys.** A response stores `HMAC(salt, surveyId + userId)` instead of the user ID. That is
  enough to block duplicate submissions without keeping who answered what.

## Known limitations

- The relay uses `emit()`, which doesn't wait for async handlers, and marks the message as processed right
  after. So a handler that fails is logged but not retried.
- No row locking on the outbox. Running more than one instance would need `FOR UPDATE SKIP LOCKED` or a
  similar approach.
- Events stay in-process. Moving them to a broker would only change the relay, not the modules.
- ChatWork, Google Calendar and Drive adapters are stubs unless the related env vars are set.
- Registering doesn't check yet that the event exists.

## Tests and CI

```bash
pnpm test          # unit tests (domain + handlers)
pnpm test:cov      # with the coverage threshold on domain/
pnpm test:e2e      # HTTP tests against a real postgres (docker compose up -d first)
```

On every PR, CI runs: typecheck, the architecture rules (`pnpm arch`), lint, unit tests with coverage
and e2e tests. It also checks that `docs/architecture-map.md` and `docs/openapi.json` still match the code
(`pnpm map:check`, `pnpm openapi:check`).

## AI tooling

Most of this code was written together with AI coding agents (Claude Code). [`AGENTS.md`](AGENTS.md)
holds the rules they work under, and the CI checks above apply to their changes the same way they
apply to mine.
