export interface SerializedException {
  message: string;
  code: string;
  correlationId?: string;
}

/**
 * Base for THROWN technical/unexpected failures. Business-rule violations are NOT thrown — they are
 * returned as Result<T, DomainError>. Every exception carries a stable `code` for the global filter.
 */
export abstract class ExceptionBase extends Error {
  abstract readonly code: string;
  readonly metadata?: unknown;

  constructor(message: string, options?: { cause?: Error; metadata?: unknown }) {
    super(message);
    this.metadata = options?.metadata;
    if (options?.cause) this.cause = options.cause;
  }

  toJSON(): SerializedException {
    return { message: this.message, code: this.code };
  }
}
