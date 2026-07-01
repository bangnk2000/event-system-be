import { Command, CommandProps } from '@libs/ddd';
import { NotificationType } from '../../domain/notification-preference.types';

export class UpdateNotificationPreferenceCommand extends Command {
  readonly userId: string;
  readonly type: NotificationType;
  readonly enabled: boolean;

  constructor(props: CommandProps<UpdateNotificationPreferenceCommand>) {
    super(props);
    this.userId = props.userId;
    this.type = props.type;
    this.enabled = props.enabled;
  }
}
