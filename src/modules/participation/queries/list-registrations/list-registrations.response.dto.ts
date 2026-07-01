import { ApiProperty } from '@nestjs/swagger';

export class RegistrationListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Registrant / team captain user id.' })
  userId!: string;

  @ApiProperty({ description: 'INDIVIDUAL or TEAM.' })
  mode!: string;

  @ApiProperty({ nullable: true, description: 'Team name (null for individuals).' })
  teamName!: string | null;

  @ApiProperty({ description: 'REGISTERED or CANCELLED.' })
  status!: string;

  @ApiProperty({ description: 'Whether the registrant has checked in.' })
  checkedIn!: boolean;
}
