/** The kinds of notification a user can opt out of. Extend as new notifications are added. */
export enum NotificationType {
  /** Confirmation sent to a registrant when their registration is cancelled. */
  REGISTRATION_CANCELLED = 'REGISTRATION_CANCELLED',
}

export interface NotificationPreferenceProps {
  /** Types the user has opted OUT of. Absence = enabled (opt-out model, default receive all). */
  disabledTypes: NotificationType[];
}
