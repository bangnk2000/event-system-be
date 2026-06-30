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

## Commands
```
pnpm build · pnpm typecheck · pnpm test · pnpm arch · pnpm migration:run
```

## Known skeleton shortcuts (replace before prod)
- Auth is stubbed via header `x-user-id` (`@CurrentUserId()`); real Google SSO is a later slice.
- Logger is a console adapter behind `LoggerPort` (pino is the prod choice).
- `OutboxRelay` emits in-process via `EventEmitter2`; external ChatWork/Calendar/Drive adapters TBD.
