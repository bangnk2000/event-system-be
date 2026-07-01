import { ApiProperty } from '@nestjs/swagger';

/** Read-side projection shaped for the list screen (title already localized). */
export class EventListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Localized title for the requested `lang`.' })
  title!: string;

  @ApiProperty({ description: 'Event type (see EventType).' })
  type!: string;

  @ApiProperty({ description: 'Lifecycle status (DRAFT, PUBLISHED, REGISTRATION_OPEN, …).' })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  startAt!: string;

  @ApiProperty({ format: 'date-time' })
  endAt!: string;
}
