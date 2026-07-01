import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { GetNotificationPreferencesQuery } from './get-notification-preferences.query';
import { NotificationPreferenceResponseDto } from '../../dtos/notification-preference.response.dto';

@ApiTags('notifications')
@Controller({ path: 'notification-preferences', version: '1' })
export class GetNotificationPreferencesHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({
    summary: 'Get the current user’s notification preferences',
    description: 'Returns every notification type with its enabled flag (defaults to all enabled).',
  })
  @ApiOkResponse({ type: NotificationPreferenceResponseDto })
  @ApiStandardErrors()
  async get(@CurrentUserId() userId: string): Promise<NotificationPreferenceResponseDto> {
    return this.queryBus.execute(new GetNotificationPreferencesQuery({ userId }));
  }
}
