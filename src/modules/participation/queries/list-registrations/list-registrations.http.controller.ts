import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { ListRegistrationsQuery } from './list-registrations.query';
import { RegistrationListItemDto } from './list-registrations.response.dto';

@ApiTags('participation')
@Controller({ path: 'events', version: '1' })
export class ListRegistrationsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':eventId/registrations')
  @ApiOperation({ summary: 'List registrations for an event' })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiOkResponse({ type: RegistrationListItemDto, isArray: true })
  @ApiStandardErrors()
  async list(@Param('eventId') eventId: string): Promise<RegistrationListItemDto[]> {
    return this.queryBus.execute(new ListRegistrationsQuery({ eventId }));
  }
}
