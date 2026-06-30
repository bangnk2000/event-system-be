import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ExceptionBase } from './exception.base';
import { ArgumentInvalidException } from './argument-invalid.exception';
import { NotFoundException } from './not-found.exception';
import { ConflictException } from './conflict.exception';

/**
 * Maps THROWN exceptions to HTTP responses. It never sees domain errors — controllers match() the
 * Result and convert domain errors to status codes themselves (see *.http.controller.ts).
 *
 * Handles three families: our libs/exceptions (technical faults), Nest's own HttpException
 * (ValidationPipe 400, Unauthorized 401, etc.), and anything else (-> 500).
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = { message: 'Internal server error', code: 'GENERIC.INTERNAL' };

    if (exception instanceof ArgumentInvalidException) {
      status = HttpStatus.BAD_REQUEST;
      body = { ...exception.toJSON() };
    } else if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      body = { ...exception.toJSON() };
    } else if (exception instanceof ConflictException) {
      status = HttpStatus.CONFLICT;
      body = { ...exception.toJSON() };
    } else if (exception instanceof ExceptionBase) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = { ...exception.toJSON() };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      body =
        typeof response === 'string'
          ? { message: response, code: `HTTP.${status}` }
          : { ...(response as Record<string, unknown>), code: `HTTP.${status}` };
    }

    if (status >= 500) this.logger.error(exception);
    else this.logger.warn(exception instanceof Error ? exception.message : String(exception));

    res.status(status).json(body);
  }
}
