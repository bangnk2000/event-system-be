import { ApiProperty } from '@nestjs/swagger';

export class TournamentListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'SINGLE_ELIM | ROUND_ROBIN | GROUP_KNOCKOUT' })
  format!: string;

  @ApiProperty({ description: 'DRAFT | SEEDED | IN_PROGRESS | COMPLETED | CANCELLED' })
  status!: string;

  @ApiProperty({ nullable: true, description: 'GROUP or KNOCKOUT for group→knockout; null otherwise.' })
  stage!: string | null;

  @ApiProperty({ type: Number })
  competitorCount!: number;
}
