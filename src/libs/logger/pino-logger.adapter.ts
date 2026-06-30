import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { LoggerPort } from '@libs/ports/logger.port';

/**
 * LoggerPort backed by pino (via nestjs-pino). Call sites keep using LoggerPort — only the
 * adapter changed from the console skeleton to structured JSON logging.
 */
@Injectable()
export class PinoLoggerAdapter implements LoggerPort {
  constructor(private readonly logger: PinoLogger) {}

  log(message: string, ...meta: unknown[]): void {
    this.logger.info(message, ...meta);
  }

  error(message: string, trace?: unknown, ...meta: unknown[]): void {
    if (trace !== undefined) {
      this.logger.error({ trace }, message, ...meta);
    } else {
      this.logger.error(message, ...meta);
    }
  }

  warn(message: string, ...meta: unknown[]): void {
    this.logger.warn(message, ...meta);
  }

  debug(message: string, ...meta: unknown[]): void {
    this.logger.debug(message, ...meta);
  }

  setContext(context: string): void {
    this.logger.setContext(context);
  }
}
