import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { EventLocation, EventType } from '../domain/event.types';
import { RegistrationMode } from '../domain/value-objects/registration-policy.value-object';
import { EventStatusEnum } from '../domain/value-objects/event-status.value-object';
import { OrganizerRole } from '../domain/value-objects/organizing-committee-member.value-object';

export interface CommitteeMemberRow {
  userId: string;
  role: OrganizerRole;
}

/** DB row shape — kept SEPARATE from the domain entity; bridged only by event.mapper.ts. */
@Entity({ name: 'events' })
export class EventOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'title_vi', type: 'varchar', length: 200 })
  titleVi!: string;

  @Column({ name: 'title_ja', type: 'varchar', length: 200, nullable: true })
  titleJa!: string | null;

  @Column({ name: 'description_vi', type: 'text', nullable: true })
  descriptionVi!: string | null;

  @Column({ name: 'description_ja', type: 'text', nullable: true })
  descriptionJa!: string | null;

  @Column({ type: 'varchar', length: 50 })
  type!: EventType;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  status!: EventStatusEnum;

  @Index()
  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  location!: EventLocation | null;

  @Column({ type: 'int', nullable: true })
  capacity!: number | null;

  @Column({ name: 'registration_mode', type: 'varchar', length: 20 })
  registrationMode!: RegistrationMode;

  @Column({ name: 'registration_deadline', type: 'timestamptz', nullable: true })
  registrationDeadline!: Date | null;

  @Column({ type: 'jsonb' })
  committee!: CommitteeMemberRow[];

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
