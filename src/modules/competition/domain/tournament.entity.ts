import { Err, Ok, Result } from 'oxide.ts';
import { AggregateRoot } from '@libs/ddd';
import { Competitor } from './competitor';
import { Match } from './match';
import { MultilingualText } from './value-objects/multilingual-text.value-object';
import {
  MatchStatus,
  TournamentConfig,
  TournamentFormat,
  TournamentStage,
  TournamentStatus,
} from './competition.types';
import {
  CompetitorNotFoundError,
  DuplicateCompetitorError,
  InvalidScoreError,
  InvalidSeedingError,
  InvalidTournamentStateError,
  KnockoutNotReadyError,
  MatchNotFoundError,
  MatchNotPlayableError,
} from './competition.errors';
import { TournamentCreatedDomainEvent } from './events/tournament-created.domain-event';
import { TournamentSeededDomainEvent } from './events/tournament-seeded.domain-event';
import { MatchResultRecordedDomainEvent } from './events/match-result-recorded.domain-event';
import { KnockoutStageGeneratedDomainEvent } from './events/knockout-stage-generated.domain-event';
import { TournamentCompletedDomainEvent } from './events/tournament-completed.domain-event';
import { Entrant, generateSingleElim } from './services/bracket-generator';
import { generateRoundRobin } from './services/round-robin-generator';
import { assignGroups, groupLabelAt } from './services/group-assigner';
import { computeStandings } from './services/standings-calculator';

export interface TournamentProps {
  eventId: string;
  name: MultilingualText;
  format: TournamentFormat;
  status: TournamentStatus;
  stage: TournamentStage | null;
  config: TournamentConfig;
  createdBy: string;
  competitors: Competitor[];
  matches: Match[];
}

export interface CreateTournamentProps {
  eventId: string;
  createdBy: string;
  name: MultilingualText;
  format: TournamentFormat;
  config: TournamentConfig;
}

/** Ids come from infrastructure; the domain never calls crypto/clock. */
export type IdFactory = () => string;

/**
 * Tournament aggregate (one or more per event). Owns competitors + matches; the consistency boundary
 * for seeding and elim advancement. Competitors are editable only while DRAFT.
 */
export class TournamentEntity extends AggregateRoot<TournamentProps> {
  static create(props: CreateTournamentProps, id: string, now: Date): TournamentEntity {
    const tournament = new TournamentEntity({
      id,
      createdAt: now,
      updatedAt: now,
      props: {
        eventId: props.eventId,
        name: props.name,
        format: props.format,
        status: TournamentStatus.DRAFT,
        stage: null,
        config: props.config,
        createdBy: props.createdBy,
        competitors: [],
        matches: [],
      },
    });
    tournament.addEvent(
      new TournamentCreatedDomainEvent({ aggregateId: id, eventId: props.eventId }),
    );
    return tournament;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get format(): TournamentFormat {
    return this.props.format;
  }

  get status(): TournamentStatus {
    return this.props.status;
  }

  get stage(): TournamentStage | null {
    return this.props.stage;
  }

  get competitors(): readonly Competitor[] {
    return this.props.competitors;
  }

  get matches(): readonly Match[] {
    return this.props.matches;
  }

  addCompetitor(
    registrationId: string,
    displayName: string,
    competitorId: string,
    now: Date,
  ): Result<string, InvalidTournamentStateError | DuplicateCompetitorError> {
    if (this.props.status !== TournamentStatus.DRAFT) {
      return Err(new InvalidTournamentStateError('add a competitor to', this.props.status));
    }
    if (this.props.competitors.some((c) => c.registrationId === registrationId)) {
      return Err(new DuplicateCompetitorError());
    }
    const seed = this.props.competitors.reduce((max, c) => Math.max(max, c.seed), 0) + 1;
    this.props.competitors.push(new Competitor(competitorId, registrationId, seed, displayName, null));
    this.setUpdatedAt(now);
    return Ok(competitorId);
  }

  removeCompetitor(
    competitorId: string,
    now: Date,
  ): Result<void, InvalidTournamentStateError | CompetitorNotFoundError> {
    if (this.props.status !== TournamentStatus.DRAFT) {
      return Err(new InvalidTournamentStateError('remove a competitor from', this.props.status));
    }
    const index = this.props.competitors.findIndex((c) => c.competitorId === competitorId);
    if (index < 0) return Err(new CompetitorNotFoundError());
    this.props.competitors.splice(index, 1);
    this.setUpdatedAt(now);
    return Ok(undefined);
  }

  /** DRAFT → SEEDED: generate the matches for the chosen format. Deterministic given seed order. */
  seed(newId: IdFactory, now: Date): Result<void, InvalidTournamentStateError | InvalidSeedingError> {
    if (this.props.status !== TournamentStatus.DRAFT) {
      return Err(new InvalidTournamentStateError('seed', this.props.status));
    }
    const validation = this.validateSeedable();
    if (validation.isErr()) return validation;

    switch (this.props.format) {
      case TournamentFormat.SINGLE_ELIM: {
        this.props.matches = generateSingleElim(this.toEntrants(this.props.competitors), newId);
        break;
      }
      case TournamentFormat.ROUND_ROBIN: {
        const ids = this.props.competitors.map((c) => c.competitorId);
        this.props.matches = generateRoundRobin(ids, newId);
        break;
      }
      case TournamentFormat.GROUP_KNOCKOUT: {
        const numGroups = this.props.config.numGroups as number;
        this.props.competitors = assignGroups(this.props.competitors, numGroups);
        const matches: Match[] = [];
        for (let g = 0; g < numGroups; g++) {
          const label = groupLabelAt(g);
          const groupIds = this.props.competitors
            .filter((c) => c.groupLabel === label)
            .map((c) => c.competitorId);
          matches.push(
            ...generateRoundRobin(groupIds, newId, {
              groupLabel: label,
              stage: TournamentStage.GROUP,
            }),
          );
        }
        this.props.matches = matches;
        this.props.stage = TournamentStage.GROUP;
        break;
      }
    }

    this.props.status = TournamentStatus.SEEDED;
    this.setUpdatedAt(now);
    this.addEvent(
      new TournamentSeededDomainEvent({
        aggregateId: this.id,
        eventId: this.props.eventId,
        format: this.props.format,
      }),
    );
    return Ok(undefined);
  }

  recordMatchResult(
    matchId: string,
    scoreA: number,
    scoreB: number,
    detail: string | null,
    now: Date,
  ): Result<
    void,
    InvalidTournamentStateError | MatchNotFoundError | MatchNotPlayableError | InvalidScoreError
  > {
    if (
      this.props.status !== TournamentStatus.SEEDED &&
      this.props.status !== TournamentStatus.IN_PROGRESS
    ) {
      return Err(new InvalidTournamentStateError('record a result in', this.props.status));
    }
    const match = this.props.matches.find((m) => m.matchId === matchId);
    if (!match) return Err(new MatchNotFoundError());
    if (match.status !== MatchStatus.SCHEDULED || !match.hasBothCompetitors()) {
      return Err(new MatchNotPlayableError());
    }
    if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
      return Err(new InvalidScoreError('scores must be non-negative integers'));
    }
    if (scoreA === scoreB && this.isEliminationMatch(match)) {
      return Err(new InvalidScoreError('a knockout match cannot end in a draw'));
    }

    match.scoreA = scoreA;
    match.scoreB = scoreB;
    match.detail = detail;
    match.status = MatchStatus.PLAYED;
    match.winner =
      scoreA > scoreB
        ? match.competitorA
        : scoreA < scoreB
          ? match.competitorB
          : null; // draw allowed only in round-robin; no winner

    // Elim advancement.
    if (match.winner && match.nextMatchId && match.nextSlot) {
      const parent = this.props.matches.find((m) => m.matchId === match.nextMatchId);
      if (parent) {
        parent.fillSlot(match.nextSlot, match.winner);
        if (parent.status === MatchStatus.PENDING && parent.hasBothCompetitors()) {
          parent.status = MatchStatus.SCHEDULED;
        }
      }
    }

    if (this.props.status === TournamentStatus.SEEDED) {
      this.props.status = TournamentStatus.IN_PROGRESS;
    }
    this.setUpdatedAt(now);
    this.addEvent(
      new MatchResultRecordedDomainEvent({
        aggregateId: this.id,
        matchId,
        winner: match.winner ?? '',
      }),
    );
    return Ok(undefined);
  }

  /** GROUP_KNOCKOUT only: once every group match is played, build the knockout bracket from top-K. */
  advanceToKnockout(
    newId: IdFactory,
    now: Date,
  ): Result<void, InvalidTournamentStateError | KnockoutNotReadyError> {
    if (this.props.format !== TournamentFormat.GROUP_KNOCKOUT) {
      return Err(new KnockoutNotReadyError('tournament is not group→knockout'));
    }
    if (this.props.stage !== TournamentStage.GROUP) {
      return Err(new InvalidTournamentStateError('advance to knockout', this.props.status));
    }
    const groupMatches = this.props.matches.filter((m) => m.stage === TournamentStage.GROUP);
    if (!groupMatches.every((m) => m.status === MatchStatus.PLAYED)) {
      return Err(new KnockoutNotReadyError('not every group match has a result yet'));
    }

    const numGroups = this.props.config.numGroups as number;
    const advancePerGroup = this.props.config.advancePerGroup as number;

    // Top-K per group, ordered by within-group standings.
    const advancers: { competitorId: string; groupIndex: number; rank: number }[] = [];
    for (let g = 0; g < numGroups; g++) {
      const label = groupLabelAt(g);
      const groupCompetitors = this.props.competitors.filter((c) => c.groupLabel === label);
      const table = computeStandings(
        groupCompetitors,
        groupMatches.filter((m) => m.groupLabel === label),
      );
      table.slice(0, advancePerGroup).forEach((s, rank) => {
        advancers.push({ competitorId: s.competitorId, groupIndex: g, rank });
      });
    }

    // Cross-group seeding: all group winners first (by group), then all runners-up, etc.
    advancers.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.groupIndex - b.groupIndex));
    const entrants: Entrant[] = advancers.map((a, i) => ({ competitorId: a.competitorId, seed: i + 1 }));

    const knockout = generateSingleElim(entrants, newId, TournamentStage.KNOCKOUT);
    this.props.matches.push(...knockout);
    this.props.stage = TournamentStage.KNOCKOUT;
    this.setUpdatedAt(now);
    this.addEvent(
      new KnockoutStageGeneratedDomainEvent({ aggregateId: this.id, eventId: this.props.eventId }),
    );
    return Ok(undefined);
  }

  complete(now: Date): Result<void, InvalidTournamentStateError> {
    if (this.props.status !== TournamentStatus.IN_PROGRESS) {
      return Err(new InvalidTournamentStateError('complete', this.props.status));
    }
    if (
      this.props.format === TournamentFormat.GROUP_KNOCKOUT &&
      this.props.stage !== TournamentStage.KNOCKOUT
    ) {
      return Err(new InvalidTournamentStateError('complete (knockout not started)', this.props.status));
    }
    const settled = this.props.matches.every(
      (m) => m.status === MatchStatus.PLAYED || m.status === MatchStatus.BYE,
    );
    if (!settled) {
      return Err(new InvalidTournamentStateError('complete (matches remain)', this.props.status));
    }

    this.props.status = TournamentStatus.COMPLETED;
    this.setUpdatedAt(now);
    this.addEvent(
      new TournamentCompletedDomainEvent({
        aggregateId: this.id,
        eventId: this.props.eventId,
        championCompetitorId: this.champion(),
      }),
    );
    return Ok(undefined);
  }

  cancel(now: Date): Result<void, InvalidTournamentStateError> {
    if (this.props.status === TournamentStatus.COMPLETED) {
      return Err(new InvalidTournamentStateError('cancel', this.props.status));
    }
    this.props.status = TournamentStatus.CANCELLED;
    this.setUpdatedAt(now);
    return Ok(undefined);
  }

  /** The champion competitor id, or null if undecided. */
  champion(): string | null {
    if (this.props.format === TournamentFormat.ROUND_ROBIN) {
      const table = computeStandings(this.props.competitors, [...this.props.matches]);
      return table[0]?.competitorId ?? null;
    }
    // Elim / knockout: winner of the root match (the one nothing advances into).
    const finalStage =
      this.props.format === TournamentFormat.GROUP_KNOCKOUT ? TournamentStage.KNOCKOUT : null;
    const bracket = this.props.matches.filter((m) => m.stage === finalStage);
    const root = bracket.find((m) => m.nextMatchId === null);
    return root?.winner ?? null;
  }

  private isEliminationMatch(match: Match): boolean {
    if (this.props.format === TournamentFormat.ROUND_ROBIN) return false;
    if (this.props.format === TournamentFormat.GROUP_KNOCKOUT) {
      return match.stage === TournamentStage.KNOCKOUT;
    }
    return true; // SINGLE_ELIM
  }

  private toEntrants(competitors: readonly Competitor[]): Entrant[] {
    return competitors.map((c) => ({ competitorId: c.competitorId, seed: c.seed }));
  }

  private validateSeedable(): Result<void, InvalidSeedingError> {
    const n = this.props.competitors.length;
    if (n < 2) return Err(new InvalidSeedingError('need at least 2 competitors'));

    if (this.props.format === TournamentFormat.GROUP_KNOCKOUT) {
      const numGroups = this.props.config.numGroups;
      const advancePerGroup = this.props.config.advancePerGroup;
      if (!numGroups || numGroups < 2) {
        return Err(new InvalidSeedingError('group→knockout needs at least 2 groups'));
      }
      if (n < numGroups * 2) {
        return Err(new InvalidSeedingError('each group needs at least 2 competitors'));
      }
      const smallestGroup = Math.floor(n / numGroups);
      if (!advancePerGroup || advancePerGroup < 1 || advancePerGroup > smallestGroup) {
        return Err(
          new InvalidSeedingError(`advancePerGroup must be between 1 and ${smallestGroup}`),
        );
      }
      if (advancePerGroup * numGroups < 2) {
        return Err(new InvalidSeedingError('knockout needs at least 2 advancing competitors'));
      }
    }
    return Ok(undefined);
  }

  public validate(): void {
    this.guardAgainstEmpty(this.props.eventId, 'eventId');
    this.guardAgainstEmpty(this.props.createdBy, 'createdBy');
  }
}
