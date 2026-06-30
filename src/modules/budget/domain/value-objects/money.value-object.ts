import { ValueObject } from '@libs/ddd';
import { Guard } from '@libs/guard';
import { ArgumentInvalidException } from '@libs/exceptions';

export interface MoneyProps {
  amount: number;
  currency: string;
}

/** Non-negative monetary amount in a single currency. */
export class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  protected validate(props: MoneyProps): void {
    if (!Number.isFinite(props.amount) || props.amount < 0) {
      throw new ArgumentInvalidException('Amount must be a non-negative number');
    }
    if (Guard.isEmpty(props.currency)) {
      throw new ArgumentInvalidException('Currency is required');
    }
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new ArgumentInvalidException('Cannot add amounts of different currencies');
    }
    return Money.create(this.amount + other.amount, this.currency);
  }

  static create(amount: number, currency: string): Money {
    return new Money({ amount, currency });
  }

  static zero(currency: string): Money {
    return new Money({ amount: 0, currency });
  }
}
