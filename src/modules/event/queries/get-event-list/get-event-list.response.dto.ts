/** Read-side projection shaped for the list screen (title already localized). */
export class EventListItemDto {
  id!: string;
  title!: string;
  type!: string;
  status!: string;
  startAt!: string;
  endAt!: string;
}
