import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { LOGGER_PORT, LoggerPort } from '@libs/ports/logger.port';

/**
 * Verifies a Google ID token from `Authorization: Bearer <idToken>` and sets req.user.
 *
 * Enforcement is gated on GOOGLE_CLIENT_ID:
 * - unset  → SSO not configured: permissive, dev falls back to the `x-user-id` stub.
 * - set    → SSO enforced: a valid Bearer ID token is REQUIRED; missing/invalid → 401
 *            (the `x-user-id` fallback is no longer reachable for protected routes).
 */
@Injectable()
export class GoogleSsoGuard implements CanActivate {
  private readonly client: OAuth2Client;
  private readonly clientId?: string;

  constructor(
    config: ConfigService,
    @Inject(LOGGER_PORT) private readonly logger: LoggerPort,
  ) {
    this.clientId = config.get<string>('GOOGLE_CLIENT_ID');
    this.client = new OAuth2Client(this.clientId);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: unknown = req.headers['authorization'];
    const idToken =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice('Bearer '.length)
        : null;

    if (!this.clientId) return true; // SSO not configured — dev fallback (x-user-id) allowed
    if (idToken === null) throw new UnauthorizedException('Missing Google ID token'); // SSO enforced

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new Error('empty token payload');
      req.user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      this.logger.warn('Google ID token verification failed');
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }
}
