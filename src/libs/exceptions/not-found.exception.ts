import { ExceptionBase } from './exception.base';

export class NotFoundException extends ExceptionBase {
  readonly code = 'GENERIC.NOT_FOUND';
}
