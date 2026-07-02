import { ApiProperty } from '@nestjs/swagger';

export class EventReportEventDto {
  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty({ description: 'Vietnamese title.' })
  title!: string;

  @ApiProperty({ description: 'Current lifecycle status.' })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  startAt!: string;

  @ApiProperty({ format: 'date-time' })
  endAt!: string;

  @ApiProperty({ type: Number, nullable: true, description: 'Capacity cap, if any.' })
  capacity!: number | null;
}

export class EventReportParticipationDto {
  @ApiProperty({ type: Number, description: 'Active (REGISTERED) registrations.' })
  registered!: number;

  @ApiProperty({ type: Number, description: 'Cancelled registrations.' })
  cancelled!: number;

  @ApiProperty({ type: Number, description: 'Registrations that checked in.' })
  checkedIn!: number;

  @ApiProperty({ type: Number, description: 'Active individual registrations.' })
  individual!: number;

  @ApiProperty({ type: Number, description: 'Active team registrations.' })
  team!: number;

  @ApiProperty({ type: Number, description: 'checkedIn / registered (0..1), 2 decimals.' })
  checkInRate!: number;
}

export class EventReportBudgetDto {
  @ApiProperty({ description: 'Whether a budget exists for the event.' })
  exists!: boolean;

  @ApiProperty({ nullable: true, description: 'Budget currency code (null if no budget).' })
  currency!: string | null;

  @ApiProperty({ nullable: true, description: 'DRAFT or FINALIZED (null if no budget).' })
  status!: string | null;

  @ApiProperty({ type: Number, description: 'Sum of planned amounts.' })
  totalPlanned!: number;

  @ApiProperty({ type: Number, description: 'Sum of actual amounts.' })
  totalActual!: number;

  @ApiProperty({ type: Number, description: 'Planned minus actual (positive = under budget).' })
  variance!: number;
}

export class EventReportDto {
  @ApiProperty({ type: EventReportEventDto })
  event!: EventReportEventDto;

  @ApiProperty({ type: EventReportParticipationDto })
  participation!: EventReportParticipationDto;

  @ApiProperty({ type: EventReportBudgetDto })
  budget!: EventReportBudgetDto;

  @ApiProperty({ format: 'date-time', description: 'When the report was generated.' })
  generatedAt!: string;
}
