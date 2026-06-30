import { Global, Module } from '@nestjs/common';
import { LOGGER_PORT } from '@libs/ports/logger.port';
import { ConsoleLoggerAdapter } from './console-logger.adapter';

@Global()
@Module({
  providers: [{ provide: LOGGER_PORT, useClass: ConsoleLoggerAdapter }],
  exports: [LOGGER_PORT],
})
export class LoggerModule {}
