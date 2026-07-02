import { Injectable } from '@nestjs/common';
import { Mapper } from '@libs/ddd';
import { TournamentEntity } from '../domain/tournament.entity';
import { Competitor } from '../domain/competitor';
import { Match } from '../domain/match';
import { MultilingualText } from '../domain/value-objects/multilingual-text.value-object';
import { TournamentOrmEntity } from './tournament.persistence.model';
import { TournamentResponseDto } from '../dtos/tournament.response.dto';

@Injectable()
export class TournamentMapper
  implements Mapper<TournamentEntity, TournamentOrmEntity, TournamentResponseDto>
{
  toDomain(record: TournamentOrmEntity): TournamentEntity {
    return new TournamentEntity({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        eventId: record.eventId,
        name: MultilingualText.create(record.nameVi, record.nameJa ?? undefined),
        format: record.format,
        status: record.status,
        stage: record.stage,
        config: {
          numGroups: record.config.numGroups,
          advancePerGroup: record.config.advancePerGroup,
          seedMethod: record.config.seedMethod,
        },
        createdBy: record.createdBy,
        competitors: record.competitors.map(
          (c) =>
            new Competitor(c.competitorId, c.registrationId, c.seed, c.displayName, c.groupLabel),
        ),
        matches: record.matches.map((m) => new Match({ ...m })),
      },
    });
  }

  toPersistence(entity: TournamentEntity): TournamentOrmEntity {
    const props = entity.getProps();
    const row = new TournamentOrmEntity();
    row.id = props.id;
    row.eventId = props.eventId;
    row.nameVi = props.name.vi;
    row.nameJa = props.name.ja ?? null;
    row.format = props.format;
    row.status = props.status;
    row.stage = props.stage;
    row.config = {
      numGroups: props.config.numGroups,
      advancePerGroup: props.config.advancePerGroup,
      seedMethod: props.config.seedMethod,
    };
    row.createdBy = props.createdBy;
    row.competitors = props.competitors.map((c) => ({
      competitorId: c.competitorId,
      registrationId: c.registrationId,
      seed: c.seed,
      displayName: c.displayName,
      groupLabel: c.groupLabel,
    }));
    row.matches = props.matches.map((m) => ({
      matchId: m.matchId,
      round: m.round,
      slotInRound: m.slotInRound,
      groupLabel: m.groupLabel,
      stage: m.stage,
      competitorA: m.competitorA,
      competitorB: m.competitorB,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      winner: m.winner,
      status: m.status,
      nextMatchId: m.nextMatchId,
      nextSlot: m.nextSlot,
      detail: m.detail,
    }));
    row.createdAt = props.createdAt;
    row.updatedAt = props.updatedAt;
    return row;
  }

  toResponse(entity: TournamentEntity): TournamentResponseDto {
    const props = entity.getProps();
    const dto = new TournamentResponseDto();
    dto.id = props.id;
    dto.eventId = props.eventId;
    dto.name = props.name.vi;
    dto.format = props.format;
    dto.status = props.status;
    return dto;
  }
}
