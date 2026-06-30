export abstract class QueryBase {}

export interface PaginatedParams {
  limit?: number;
  page?: number;
}

export abstract class PaginatedQueryBase extends QueryBase {
  readonly limit: number;
  readonly page: number;
  readonly offset: number;

  constructor(props: PaginatedParams) {
    super();
    this.limit = props.limit ?? 20;
    this.page = props.page ?? 0;
    this.offset = this.page * this.limit;
  }
}

export class Paginated<T> {
  readonly count: number;
  readonly limit: number;
  readonly page: number;
  readonly data: readonly T[];

  constructor(props: { count: number; limit: number; page: number; data: readonly T[] }) {
    this.count = props.count;
    this.limit = props.limit;
    this.page = props.page;
    this.data = props.data;
  }
}
