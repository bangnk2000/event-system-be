import { Command, CommandProps } from '@libs/ddd';
import { ParticipationMode } from '../../domain/registration.types';

export class RegisterForEventCommand extends Command {
  readonly eventId: string;
  readonly userId: string;
  readonly mode: ParticipationMode;
  readonly teamName?: string;
  readonly memberIds?: string[];

  constructor(props: CommandProps<RegisterForEventCommand>) {
    super(props);
    this.eventId = props.eventId;
    this.userId = props.userId;
    this.mode = props.mode;
    this.teamName = props.teamName;
    this.memberIds = props.memberIds;
  }
}
