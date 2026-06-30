// Pure exception classes only — the Nest-coupled exception.filter is imported directly where needed
// (src/main.ts), so importing this barrel never drags @nestjs/* into the domain graph.
export * from './exception.base';
export * from './argument-invalid.exception';
export * from './not-found.exception';
export * from './conflict.exception';
