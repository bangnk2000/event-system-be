import { ApiProperty } from '@nestjs/swagger';

export class BracketCompetitorDto {
  @ApiProperty({ format: 'uuid' })
  competitorId!: string;

  @ApiProperty({ type: Number })
  seed!: number;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ nullable: true })
  groupLabel!: string | null;
}

export class BracketMatchDto {
  @ApiProperty({ format: 'uuid' })
  matchId!: string;

  @ApiProperty({ type: Number })
  round!: number;

  @ApiProperty({ nullable: true })
  groupLabel!: string | null;

  @ApiProperty({ nullable: true, description: 'GROUP or KNOCKOUT for group→knockout; null otherwise.' })
  stage!: string | null;

  @ApiProperty({ nullable: true, format: 'uuid' })
  competitorA!: string | null;

  @ApiProperty({ nullable: true, format: 'uuid' })
  competitorB!: string | null;

  @ApiProperty({ nullable: true, type: Number })
  scoreA!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  scoreB!: number | null;

  @ApiProperty({ nullable: true, format: 'uuid' })
  winner!: string | null;

  @ApiProperty({ description: 'PENDING | SCHEDULED | PLAYED | BYE' })
  status!: string;

  @ApiProperty({ nullable: true, format: 'uuid', description: 'Elim: the match the winner advances into.' })
  nextMatchId!: string | null;

  @ApiProperty({ nullable: true })
  detail!: string | null;
}

export class TournamentBracketDto {
  @ApiProperty({ format: 'uuid' })
  tournamentId!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'SINGLE_ELIM | ROUND_ROBIN | GROUP_KNOCKOUT' })
  format!: string;

  @ApiProperty({ description: 'DRAFT | SEEDED | IN_PROGRESS | COMPLETED | CANCELLED' })
  status!: string;

  @ApiProperty({ nullable: true })
  stage!: string | null;

  @ApiProperty({ type: [BracketCompetitorDto] })
  competitors!: BracketCompetitorDto[];

  @ApiProperty({ type: [BracketMatchDto] })
  matches!: BracketMatchDto[];
}
