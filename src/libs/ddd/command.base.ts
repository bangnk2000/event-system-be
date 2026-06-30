export interface CommandMetadata {
  /** Correlates all work triggered by one inbound request. */
  readonly correlationId?: string;
  /** The id of the message that caused this command (Command -> Event -> Command). */
  readonly causationId?: string;
  /** The acting user (from auth), when relevant. */
  readonly userId?: string;
}

export type CommandProps<T> = Omit<T, 'metadata'> & {
  metadata?: CommandMetadata;
};

export abstract class Command {
  readonly metadata: CommandMetadata;

  constructor(props: { metadata?: CommandMetadata }) {
    this.metadata = props.metadata ?? {};
  }
}
