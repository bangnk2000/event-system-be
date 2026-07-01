import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class RescheduleEventRequestDto {
  @ApiProperty({ format: 'date-time', description: 'New start (ISO 8601).', example: '2026-08-02T09:00:00.000Z' })
  @IsISO8601()
  readonly startAt!: string;

  @ApiProperty({ format: 'date-time', description: 'New end (ISO 8601), after start.', example: '2026-08-02T12:00:00.000Z' })
  @IsISO8601()
  readonly endAt!: string;
}
