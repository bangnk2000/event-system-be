import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoModule } from 'nestjs-pino';
import { LOGGER_PORT } from '@libs/ports/logger.port';
import { PinoLoggerAdapter } from './pino-logger.adapter';

@Global()
@Module({
  imports: [
    PinoModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL') ?? 'info',
          // Pretty, single-line logs in dev/test; raw JSON in production.
          transport:
            config.get<string>('NODE_ENV') === 'production'
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
          // Never log credentials.
          redact: ['req.headers.authorization', 'req.headers["x-user-id"]'],
        },
      }),
    }),
  ],
  providers: [{ provide: LOGGER_PORT, useClass: PinoLoggerAdapter }],
  exports: [LOGGER_PORT],
})
export class LoggerModule {}
