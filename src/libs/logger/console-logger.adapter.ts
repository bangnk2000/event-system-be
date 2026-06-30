import { Injectable, Logger } from '@nestjs/common';
import { LoggerPort } from '@libs/ports/logger.port';

/** Skeleton logger behind LoggerPort. Prod swaps this for a pino adapter — callers are untouched. */
@Injectable()
export class ConsoleLoggerAdapter implements LoggerPort {
  private logger = new Logger('App');

  log(message: string, ...meta: unknown[]): void {
    this.logger.log(message, ...meta);
  }

  error(message: string, trace?: unknown, ...meta: unknown[]): void {
    this.logger.error(message, trace as string, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.logger.warn(message, ...meta);
  }

  debug(message: string, ...meta: unknown[]): void {
    this.logger.debug(message, ...meta);
  }

  setContext(context: string): void {
    this.logger = new Logger(context);
  }
}
