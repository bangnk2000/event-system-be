import { IsISO8601 } from 'class-validator';

export class RescheduleEventRequestDto {
  @IsISO8601()
  readonly startAt!: string;

  @IsISO8601()
  readonly endAt!: string;
}
