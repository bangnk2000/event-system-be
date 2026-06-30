import { ValueObject } from '@libs/ddd';
import { ArgumentInvalidException } from '@libs/exceptions';

export interface DateTimeRangeProps {
  startAt: Date;
  endAt: Date;
}

export class DateTimeRange extends ValueObject<DateTimeRangeProps> {
  get startAt(): Date {
    return this.props.startAt;
  }

  get endAt(): Date {
    return this.props.endAt;
  }

  protected validate(props: DateTimeRangeProps): void {
    const validDates =
      props.startAt instanceof Date &&
      props.endAt instanceof Date &&
      !Number.isNaN(props.startAt.getTime()) &&
      !Number.isNaN(props.endAt.getTime());
    if (!validDates) {
      throw new ArgumentInvalidException('Event schedule must have valid start and end times');
    }
    if (props.endAt.getTime() <= props.startAt.getTime()) {
      throw new ArgumentInvalidException('Event end time must be after start time');
    }
  }

  static create(startAt: Date, endAt: Date): DateTimeRange {
    return new DateTimeRange({ startAt, endAt });
  }
}
