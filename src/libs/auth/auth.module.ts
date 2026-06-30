import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GoogleSsoGuard } from './google-sso.guard';

/** Registers the Google SSO guard globally. It is permissive without a Bearer token (dev fallback). */
@Global()
@Module({
  providers: [{ provide: APP_GUARD, useClass: GoogleSsoGuard }],
})
export class AuthModule {}
