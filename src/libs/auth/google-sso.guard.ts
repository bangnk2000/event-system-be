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
 * Permissive when no Bearer header is present (dev falls back to the x-user-id stub) and when
 * GOOGLE_CLIENT_ID is unset — so enabling real SSO is just a config + header change, no code change.
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
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) return true; // dev fallback
    if (!this.clientId) return true; // SSO not configured yet

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: header.slice('Bearer '.length),
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
