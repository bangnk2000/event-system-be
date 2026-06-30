import { QueryBase } from '@libs/ddd';

export class GetEventListQuery extends QueryBase {
  readonly lang: 'vi' | 'ja';

  constructor(props: { lang?: 'vi' | 'ja' }) {
    super();
    this.lang = props.lang ?? 'vi';
  }
}
