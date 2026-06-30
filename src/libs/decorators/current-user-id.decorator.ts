import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Resolves the acting user id. Prefers req.user (set by GoogleSsoGuard from a verified ID token);
 * falls back to the `x-user-id` header for dev/CI. Replace the fallback once SSO is enforced.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { id?: string } | undefined;
    const userId = user?.id ?? req.headers['x-user-id'];
    if (!userId || typeof userId !== 'string') {
      throw new UnauthorizedException('Missing authentication (Bearer token or x-user-id)');
    }
    return userId;
  },
);
