import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorDto } from './api-error.dto';

/** Default human descriptions for the status codes this API actually emits. */
const DESCRIPTIONS: Record<number, string> = {
  400: 'Validation failed or invalid argument.',
  401: 'Missing or invalid authentication (Google ID token / dev `x-user-id`).',
  403: 'Authenticated but not allowed to perform this action.',
  404: 'Referenced resource does not exist.',
  409: 'Conflicts with the current state (invalid transition, duplicate, locked).',
  500: 'Unexpected server error.',
};

/**
 * Documents the standard {@link ApiErrorDto} error envelope for the given status codes.
 * Every operation implicitly gets 401 (guard is global) and 500; pass the business-specific
 * ones it can additionally return, e.g. `@ApiStandardErrors(403, 404, 409)`.
 */
export function ApiStandardErrors(...statuses: number[]): MethodDecorator & ClassDecorator {
  const unique = Array.from(new Set([401, ...statuses, 500])).sort((a, b) => a - b);
  return applyDecorators(
    ...unique.map((status) =>
      ApiResponse({ status, description: DESCRIPTIONS[status], type: ApiErrorDto }),
    ),
  );
}
