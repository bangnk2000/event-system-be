// Defaults for the e2e run; override via real env in CI. NODE_ENV=test => schema auto-synchronizes.
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/event_system';
