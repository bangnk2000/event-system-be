import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../domain/notification-preference.types';

export class NotificationPreferenceResponseDto {
  @ApiProperty({ format: 'uuid', description: 'The user these preferences belong to.' })
  userId!: string;

  @ApiProperty({
    description:
      'Enabled flag per notification type. true = the user receives it, false = opted out. ' +
      'Every known type is always present.',
    example: { REGISTRATION_CANCELLED: true },
  })
  preferences!: Record<string, boolean>;
}

/**
 * Builds the response from raw preference state (a userId + the list of opted-out types).
 * Pure — imports only domain types, so any layer (application, interface, mapper) may call it.
 * Emits every known NotificationType so the FE can render a complete settings list.
 */
export function buildPreferenceResponse(
  userId: string,
  disabledTypes: NotificationType[],
): NotificationPreferenceResponseDto {
  const preferences: Record<string, boolean> = {};
  for (const type of Object.values(NotificationType)) {
    preferences[type] = !disabledTypes.includes(type);
  }
  const dto = new NotificationPreferenceResponseDto();
  dto.userId = userId;
  dto.preferences = preferences;
  return dto;
}
