import { ExceptionBase } from './exception.base';

export class ForbiddenException extends ExceptionBase {
  readonly code = 'GENERIC.FORBIDDEN';
}
