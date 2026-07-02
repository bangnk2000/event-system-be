import { QueryBase } from '@libs/ddd';

/**
 * Shared contract (libs/contracts) so the `event` context can fold budget totals into its event
 * report over the QueryBus without importing the `budget` internals. Both sides import this libs
 * file, not each other — dependency-cruiser's no-cross-module rule still holds. A missing budget is
 * not an error here (`exists: false`); the report is meaningful without one.
 */
export class GetEventBudgetSummaryQuery extends QueryBase {
  readonly eventId: string;

  constructor(props: { eventId: string }) {
    super();
    this.eventId = props.eventId;
  }
}

export interface EventBudgetSummary {
  exists: boolean;
  currency: string | null;
  status: string | null;
  totalPlanned: number;
  totalActual: number;
  /** Planned minus actual (positive = under budget). */
  variance: number;
}
