import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * SKELETON auth stub: reads the acting user id from the `x-user-id` header.
 * Replace with a real Google SSO guard that sets req.user from the verified token.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    const userId = req.headers['x-user-id'];
    if (!userId || typeof userId !== 'string') {
      throw new UnauthorizedException('Missing x-user-id header (auth stub)');
    }
    return userId;
  },
);
