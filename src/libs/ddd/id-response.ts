/** Standard "created" response: returns only the new aggregate id. */
export class IdResponse {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }
}
