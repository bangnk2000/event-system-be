import { Column, Entity, PrimaryColumn } from 'typeorm';
import { NotificationType } from '../domain/notification-preference.types';

@Entity({ name: 'notification_preferences' })
export class NotificationPreferenceOrmEntity {
  /** = userId (one preference row per user). */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'disabled_types', type: 'jsonb' })
  disabledTypes!: NotificationType[];

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
