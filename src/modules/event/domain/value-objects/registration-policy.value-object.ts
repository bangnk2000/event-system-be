import { ValueObject } from '@libs/ddd';
import { ArgumentInvalidException } from '@libs/exceptions';

export enum RegistrationMode {
  INDIVIDUAL = 'INDIVIDUAL',
  TEAM = 'TEAM',
  BOTH = 'BOTH',
}

export interface RegistrationPolicyProps {
  mode: RegistrationMode;
  deadline: Date | null;
}

/** Registration policy: individual / team / both, with an optional deadline. */
export class RegistrationPolicy extends ValueObject<RegistrationPolicyProps> {
  get mode(): RegistrationMode {
    return this.props.mode;
  }

  get deadline(): Date | null {
    return this.props.deadline;
  }

  protected validate(props: RegistrationPolicyProps): void {
    if (!Object.values(RegistrationMode).includes(props.mode)) {
      throw new ArgumentInvalidException(`Invalid registration mode: ${props.mode}`);
    }
  }

  static create(mode: RegistrationMode, deadline: Date | null = null): RegistrationPolicy {
    return new RegistrationPolicy({ mode, deadline });
  }
}
