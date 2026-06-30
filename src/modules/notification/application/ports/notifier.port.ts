export const NOTIFIER = Symbol('NOTIFIER');

/** Outbound port for sending a notification message (implemented by a chat/email adapter). */
export interface NotifierPort {
  notify(text: string): Promise<void>;
}
