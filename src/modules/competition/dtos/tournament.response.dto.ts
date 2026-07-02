import { ApiProperty } from '@nestjs/swagger';

export class TournamentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'SINGLE_ELIM | ROUND_ROBIN | GROUP_KNOCKOUT' })
  format!: string;

  @ApiProperty({ description: 'DRAFT | SEEDED | IN_PROGRESS | COMPLETED | CANCELLED' })
  status!: string;
}
