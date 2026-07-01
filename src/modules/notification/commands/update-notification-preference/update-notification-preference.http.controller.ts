import { Body, Controller, Put } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@libs/api-docs';
import { CurrentUserId } from '@libs/decorators/current-user-id.decorator';
import { UpdateNotificationPreferenceCommand } from './update-notification-preference.command';
import { UpdateNotificationPreferenceRequestDto } from './update-notification-preference.request.dto';
import { NotificationPreferenceResponseDto } from '../../dtos/notification-preference.response.dto';

@ApiTags('notifications')
@Controller({ path: 'notification-preferences', version: '1' })
export class UpdateNotificationPreferenceHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put()
  @ApiOperation({
    summary: 'Update the current user’s notification preference',
    description: 'Opt in or out of one notification type. Returns the full preference set.',
  })
  @ApiOkResponse({ type: NotificationPreferenceResponseDto })
  @ApiStandardErrors(400)
  async update(
    @Body() body: UpdateNotificationPreferenceRequestDto,
    @CurrentUserId() userId: string,
  ): Promise<NotificationPreferenceResponseDto> {
    return this.commandBus.execute(
      new UpdateNotificationPreferenceCommand({
        userId,
        type: body.type,
        enabled: body.enabled,
      }),
    );
  }
}
