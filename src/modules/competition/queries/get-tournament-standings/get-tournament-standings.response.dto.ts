import { ApiProperty } from '@nestjs/swagger';

export class StandingRowDto {
  @ApiProperty({ format: 'uuid' })
  competitorId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ type: Number })
  played!: number;

  @ApiProperty({ type: Number })
  won!: number;

  @ApiProperty({ type: Number })
  drawn!: number;

  @ApiProperty({ type: Number })
  lost!: number;

  @ApiProperty({ type: Number })
  scoreFor!: number;

  @ApiProperty({ type: Number })
  scoreAgainst!: number;

  @ApiProperty({ type: Number, description: 'scoreFor − scoreAgainst.' })
  diff!: number;

  @ApiProperty({ type: Number, description: 'win×3 + draw×1.' })
  points!: number;
}

export class StandingGroupDto {
  @ApiProperty({ nullable: true, description: 'Group label, or null for a single-table format.' })
  groupLabel!: string | null;

  @ApiProperty({ type: [StandingRowDto], description: 'Ranked by points → diff → scoreFor.' })
  rows!: StandingRowDto[];
}

export class TournamentStandingsDto {
  @ApiProperty({ format: 'uuid' })
  tournamentId!: string;

  @ApiProperty({ description: 'SINGLE_ELIM | ROUND_ROBIN | GROUP_KNOCKOUT' })
  format!: string;

  @ApiProperty({ type: [StandingGroupDto] })
  groups!: StandingGroupDto[];
}
