# AGENTS.md — Event System Backend

Binding conventions for any agent/human extending this repo. Derived from the
`init-nestjs-hexagonal` prompt set (NestJS 11 + Hexagonal/DDD + CQRS).

## Layers (dependencies point INWARD; inner NEVER imports outer)
```
Interface (*.http.controller, *.request/response.dto)
  → Application (commands/queries + *.service/*.query-handler + ports)
    → Domain (entity / value-object / domain-event / errors)   ← ZERO framework/IO/SDK
Infrastructure (database/*.repository, *.mapper, *.persistence.model; libs/db, libs/outbox)
  implements Application ports.
```

## Stack (locked)
- NestJS 11 · Node 22 · TypeScript 5.7 · `@nestjs/cqrs` ^11 · `@nestjs/event-emitter` ^3
- Persistence: **TypeORM + PostgreSQL** (the spec's TypeORM variant; `TypeOrmRepositoryBase` in `libs/db`)
- Result: `oxide.ts` (`Ok`/`Err`/`Result`/`match`)
- Outbox: own table + `@nestjs/schedule` poller (`libs/outbox`)

## Where to add a new use case
- State-changing → `modules/<context>/commands/<verb-noun>/`: `*.command.ts`, `*.service.ts`
  (`ICommandHandler`, returns `Result<Success, DomainError>`), `*.http.controller.ts`, `*.request.dto.ts`.
- Read-only → `modules/<context>/queries/<verb-noun>/`: `*.query.ts`, `*.query-handler.ts`
  (`IQueryHandler`; MAY read the DB directly via injected `DataSource`, bypassing domain).

## Hard rules
- Domain has ZERO `@nestjs/*`, TypeORM, `pg` imports. Inject `id` + `now`; never read clock/uuid in domain.
- Business errors → `return Err(DomainError)`; technical failures → `throw` (global filter maps them).
- No cross-module imports. Modules talk via Command/Query bus or domain events (Command → Event → Command).
- Aggregate root is the only object loaded/saved. Domain events persist to `outbox` INSIDE the write txn.
- Persistence model (`*.persistence.model.ts`) is SEPARATE from the domain entity; bridge via `*.mapper.ts`.
- Response DTO exposes only intended fields (via `mapper.toResponse()`).

## File-naming map
`*.entity.ts` · `*.value-object.ts` · `*.domain-event.ts` · `*.errors.ts` · `*.command.ts` ·
`*.service.ts` (command handler) · `*.query.ts` · `*.query-handler.ts` · `*.http.controller.ts` ·
`*.request.dto.ts` · `*.response.dto.ts` · `*.repository.port.ts` · `*.repository.ts` ·
`*.mapper.ts` · `*.persistence.model.ts` · `*.module.ts` · `*.di-tokens.ts`. Dirs = kebab-case.

## Start here (minimal context)
Read this file + [`docs/architecture-map.md`](docs/architecture-map.md) (auto-generated inventory:
every slice → folder + endpoint, every domain event → raiser + consumer, every contract). That is the
full surface — do NOT grep the repo to rediscover it. For a task, open only the one slice folder + its
aggregate entity; delegate any wider search to a subagent. After adding/removing a slice, event, or
contract, run `pnpm map` (CI's `map:check` fails if the committed map is stale).

## Commands
```
pnpm build · pnpm typecheck · pnpm test · pnpm arch · pnpm map · pnpm migration:run
```

## Contexts
- `event` (core) · `participation` (core) · `budget` (supporting) · `notification` (supporting) ·
  `survey` (supporting) · `competition` (supporting, Phase 2 sports tournaments). Add `iam` next.
- Cross-context (no module-to-module import):
  - `notification` reacts to relayed domain events by event-name string via `@OnEvent` (outbox is the bridge).
  - Modules authorize / read across contexts via query classes over the QueryBus. Shared query
    contracts live in `libs/contracts/<owner-context>/` and are imported by both sides (e.g.
    `is-event-organizer`, `is-event-open-for-registration` under `event/`; `get-event-budget-summary`
    under `budget/`; `get-event-participation-stats`, `get-event-registrations`, `is-event-participant`
    under `participation/`).

## Known skeleton shortcuts (replace before prod)
- Auth: `GoogleSsoGuard` verifies `Authorization: Bearer <google-id-token>` when `GOOGLE_CLIENT_ID`
  is set; otherwise falls back to the `x-user-id` header (dev). `@CurrentUserId()` = req.user.id ?? x-user-id.
- Logger is a console adapter behind `LoggerPort` (pino is the prod choice).
- `OutboxRelay` emits in-process via `EventEmitter2`; `NotifierPort` → `ChatWorkAdapter` logs a stub
  when `CHATWORK_*` is unset. Calendar/Drive adapters + event-existence check on register are TBD.
