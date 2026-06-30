# CLAUDE.md

Claude Code entrypoint. Read [AGENTS.md](./AGENTS.md) first — it holds the binding layer rules,
file-naming map, and "where to add a new use case".

- Architecture: NestJS 11 · Hexagonal/DDD · CQRS (lightweight, 1 PostgreSQL) · Transactional Outbox.
- Before finishing any change: `pnpm typecheck && pnpm arch` must stay green (domain purity +
  module privacy are CI-enforced).
- Do NOT import `@nestjs/*` / TypeORM into any `modules/*/domain/` file.
- Default LLM model if/when an `ai-agent` context is added: `claude-sonnet-4-6` (behind `LlmPort`).
