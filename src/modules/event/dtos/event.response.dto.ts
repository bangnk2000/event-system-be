/** Public single-event response shape (used by mapper.toResponse / future get-event-detail). */
export class EventResponseDto {
  id!: string;
  titleVi!: string;
  titleJa!: string | null;
  type!: string;
  status!: string;
  startAt!: string;
  endAt!: string;
  createdAt!: string;
}
