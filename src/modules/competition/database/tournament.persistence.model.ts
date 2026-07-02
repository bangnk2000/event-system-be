import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import {
  MatchStatus,
  SeedMethod,
  TournamentFormat,
  TournamentStage,
  TournamentStatus,
} from '../domain/competition.types';

export interface CompetitorRow {
  competitorId: string;
  registrationId: string;
  seed: number;
  displayName: string;
  groupLabel: string | null;
}

export interface MatchRow {
  matchId: string;
  round: number;
  slotInRound: number;
  groupLabel: string | null;
  stage: TournamentStage | null;
  competitorA: string | null;
  competitorB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: string | null;
  status: MatchStatus;
  nextMatchId: string | null;
  nextSlot: 'A' | 'B' | null;
  detail: string | null;
}

export interface TournamentConfigRow {
  numGroups: number | null;
  advancePerGroup: number | null;
  seedMethod: SeedMethod;
}

@Entity({ name: 'tournaments' })
export class TournamentOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @Column({ name: 'name_vi', type: 'varchar', length: 200 })
  nameVi!: string;

  @Column({ name: 'name_ja', type: 'varchar', length: 200, nullable: true })
  nameJa!: string | null;

  @Column({ type: 'varchar', length: 20 })
  format!: TournamentFormat;

  @Column({ type: 'varchar', length: 20 })
  status!: TournamentStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  stage!: TournamentStage | null;

  @Column({ type: 'jsonb' })
  config!: TournamentConfigRow;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ type: 'jsonb' })
  competitors!: CompetitorRow[];

  @Column({ type: 'jsonb' })
  matches!: MatchRow[];

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
