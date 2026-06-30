import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LOGGER_PORT, LoggerPort } from '@libs/ports/logger.port';
import { NotifierPort } from '../application/ports/notifier.port';

/**
 * Anti-corruption adapter: implements NotifierPort using the ChatWork API.
 * If no token/room is configured it logs a stub line instead — so dev/CI work without secrets.
 */
@Injectable()
export class ChatWorkAdapter implements NotifierPort {
  constructor(
    private readonly config: ConfigService,
    @Inject(LOGGER_PORT) private readonly logger: LoggerPort,
  ) {}

  async notify(text: string): Promise<void> {
    const token = this.config.get<string>('CHATWORK_API_TOKEN');
    const roomId = this.config.get<string>('CHATWORK_ROOM_ID');

    if (!token || !roomId) {
      this.logger.log(`[ChatWork stub] ${text}`);
      return;
    }

    try {
      const res = await fetch(`https://api.chatwork.com/v2/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'X-ChatWorkToken': token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ body: text }).toString(),
      });
      if (!res.ok) this.logger.error(`ChatWork API responded ${res.status}`);
    } catch (err) {
      this.logger.error('ChatWork notify failed', err);
    }
  }
}
