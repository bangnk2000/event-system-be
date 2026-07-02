import { MatchStatus, TournamentStage } from './competition.types';

export interface MatchProps {
  matchId: string;
  /** 1-based round number (elim: R1 → final; round-robin: matchday). */
  round: number;
  /** Position within the round (for ordering + elim advancement). */
  slotInRound: number;
  groupLabel: string | null;
  stage: TournamentStage | null;
  competitorA: string | null;
  competitorB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: string | null;
  status: MatchStatus;
  /** Elim only: the match the winner advances into. */
  nextMatchId: string | null;
  nextSlot: 'A' | 'B' | null;
  /** Freeform score breakdown for display, e.g. "21-18, 19-21, 21-15". */
  detail: string | null;
}

/**
 * A single contest (internal to the Tournament aggregate). Mutable — the aggregate root is the only
 * thing that mutates it (recording a score, advancing a winner into the next match).
 */
export class Match {
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

  constructor(props: MatchProps) {
    this.matchId = props.matchId;
    this.round = props.round;
    this.slotInRound = props.slotInRound;
    this.groupLabel = props.groupLabel;
    this.stage = props.stage;
    this.competitorA = props.competitorA;
    this.competitorB = props.competitorB;
    this.scoreA = props.scoreA;
    this.scoreB = props.scoreB;
    this.winner = props.winner;
    this.status = props.status;
    this.nextMatchId = props.nextMatchId;
    this.nextSlot = props.nextSlot;
    this.detail = props.detail;
  }

  hasBothCompetitors(): boolean {
    return this.competitorA !== null && this.competitorB !== null;
  }

  /** Fill an empty slot with an incoming competitor (used by elim advancement). */
  fillSlot(slot: 'A' | 'B', competitorId: string): void {
    if (slot === 'A') this.competitorA = competitorId;
    else this.competitorB = competitorId;
  }
}
