export class RegistrationResponseDto {
  id!: string;
  eventId!: string;
  mode!: string;
  userId!: string;
  teamName!: string | null;
  status!: string;
  checkedIn!: boolean;
}
