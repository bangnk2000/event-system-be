import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { REGISTRATION_REPOSITORY } from './application/ports/registration.repository.port';
import { RegisterForEventService } from './commands/register-for-event/register-for-event.service';
import { RegisterForEventHttpController } from './commands/register-for-event/register-for-event.http.controller';
import { CancelRegistrationService } from './commands/cancel-registration/cancel-registration.service';
import { CancelRegistrationHttpController } from './commands/cancel-registration/cancel-registration.http.controller';
import { CheckInService } from './commands/check-in/check-in.service';
import { CheckInHttpController } from './commands/check-in/check-in.http.controller';
import { ListRegistrationsQueryHandler } from './queries/list-registrations/list-registrations.query-handler';
import { ListRegistrationsHttpController } from './queries/list-registrations/list-registrations.http.controller';
import { RegistrationRepository } from './database/registration.repository';
import { RegistrationMapper } from './database/registration.mapper';

@Module({
  imports: [CqrsModule],
  controllers: [
    RegisterForEventHttpController,
    CancelRegistrationHttpController,
    CheckInHttpController,
    ListRegistrationsHttpController,
  ],
  providers: [
    RegistrationMapper,
    RegisterForEventService,
    CancelRegistrationService,
    CheckInService,
    ListRegistrationsQueryHandler,
    { provide: REGISTRATION_REPOSITORY, useClass: RegistrationRepository },
  ],
})
export class ParticipationModule {}
