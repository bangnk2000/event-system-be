import { ValueObject } from '@libs/ddd';
import { Guard } from '@libs/guard';
import { ArgumentInvalidException } from '@libs/exceptions';

export enum OrganizerRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

export interface OrganizingCommitteeMemberProps {
  userId: string;
  role: OrganizerRole;
}

/** A member of an event's organizing committee. Identity is the userId (scoped to the event). */
export class OrganizingCommitteeMember extends ValueObject<OrganizingCommitteeMemberProps> {
  get userId(): string {
    return this.props.userId;
  }

  get role(): OrganizerRole {
    return this.props.role;
  }

  isOwner(): boolean {
    return this.props.role === OrganizerRole.OWNER;
  }

  protected validate(props: OrganizingCommitteeMemberProps): void {
    if (Guard.isEmpty(props.userId)) {
      throw new ArgumentInvalidException('Committee member userId is required');
    }
  }

  static owner(userId: string): OrganizingCommitteeMember {
    return new OrganizingCommitteeMember({ userId, role: OrganizerRole.OWNER });
  }

  static member(userId: string): OrganizingCommitteeMember {
    return new OrganizingCommitteeMember({ userId, role: OrganizerRole.MEMBER });
  }
}
