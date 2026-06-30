import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { ParticipationMode, RegistrationStatus } from '../domain/registration.types';

@Entity({ name: 'registrations' })
export class RegistrationOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @Column({ type: 'varchar', length: 20 })
  mode!: ParticipationMode;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'team_name', type: 'varchar', length: 200, nullable: true })
  teamName!: string | null;

  @Column({ name: 'member_ids', type: 'jsonb' })
  memberIds!: string[];

  @Column({ type: 'varchar', length: 20 })
  status!: RegistrationStatus;

  @Column({ name: 'checked_in_at', type: 'timestamptz', nullable: true })
  checkedInAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
