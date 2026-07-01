import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn } from 'class-validator';
import { NotificationType } from '../../domain/notification-preference.types';

export class UpdateNotificationPreferenceRequestDto {
  @ApiProperty({
    enum: NotificationType,
    enumName: 'NotificationType',
    description: 'Which notification type to configure.',
  })
  @IsIn(Object.values(NotificationType))
  readonly type!: NotificationType;

  @ApiProperty({ description: 'true = receive this notification; false = opt out.' })
  @IsBoolean()
  readonly enabled!: boolean;
}
