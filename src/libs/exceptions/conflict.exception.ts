import { ExceptionBase } from './exception.base';

export class ConflictException extends ExceptionBase {
  readonly code = 'GENERIC.CONFLICT';
}
