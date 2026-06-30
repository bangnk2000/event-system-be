import { ExceptionBase } from './exception.base';

export class ArgumentInvalidException extends ExceptionBase {
  readonly code = 'GENERIC.ARGUMENT_INVALID';
}
