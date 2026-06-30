import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerPort } from '@libs/ports/logger.port';
import { GoogleSsoGuard } from './google-sso.guard';

const loggerStub: LoggerPort = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  setContext: jest.fn(),
};

const makeContext = (headers: Record<string, string>): ExecutionContext => {
  const req: { headers: Record<string, string>; user?: unknown } = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
};

const makeGuard = (clientId?: string): GoogleSsoGuard => {
  const config = { get: (key: string) => (key === 'GOOGLE_CLIENT_ID' ? clientId : undefined) };
  return new GoogleSsoGuard(config as unknown as ConfigService, loggerStub);
};

describe('GoogleSsoGuard', () => {
  afterEach(() => jest.clearAllMocks());

  describe('SSO not configured (GOOGLE_CLIENT_ID unset)', () => {
    it('is permissive without a Bearer token (dev x-user-id fallback)', async () => {
      const guard = makeGuard(undefined);
      await expect(guard.canActivate(makeContext({}))).resolves.toBe(true);
    });
  });

  describe('SSO enforced (GOOGLE_CLIENT_ID set)', () => {
    it('rejects a request without a Bearer token (401)', async () => {
      const guard = makeGuard('client-123.apps.googleusercontent.com');
      await expect(guard.canActivate(makeContext({ 'x-user-id': 'u1' }))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an invalid Bearer token (401)', async () => {
      const guard = makeGuard('client-123.apps.googleusercontent.com');
      (guard as unknown as { client: { verifyIdToken: jest.Mock } }).client = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('bad token')),
      };
      await expect(
        guard.canActivate(makeContext({ authorization: 'Bearer not-a-real-token' })),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(loggerStub.warn).toHaveBeenCalled();
    });

    it('accepts a valid Bearer token and sets req.user', async () => {
      const guard = makeGuard('client-123.apps.googleusercontent.com');
      (guard as unknown as { client: { verifyIdToken: jest.Mock } }).client = {
        verifyIdToken: jest
          .fn()
          .mockResolvedValue({ getPayload: () => ({ sub: 'user-42', email: 'a@b.com' }) }),
      };
      const ctx = makeContext({ authorization: 'Bearer valid' });
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      const req = ctx.switchToHttp().getRequest() as { user?: { id: string } };
      expect(req.user).toEqual({ id: 'user-42', email: 'a@b.com' });
    });
  });
});
