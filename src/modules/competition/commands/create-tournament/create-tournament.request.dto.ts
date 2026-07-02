import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { TournamentFormat } from '../../domain/competition.types';

export class CreateTournamentRequestDto {
  @ApiProperty({ example: 'Giải cầu lông nội bộ' })
  @IsString()
  @Length(1, 200)
  readonly nameVi!: string;

  @ApiPropertyOptional({ example: '社内バドミントン大会' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  readonly nameJa?: string;

  @ApiProperty({ enum: TournamentFormat })
  @IsEnum(TournamentFormat)
  readonly format!: TournamentFormat;

  @ApiPropertyOptional({
    type: Number,
    minimum: 2,
    maximum: 16,
    description: 'GROUP_KNOCKOUT only: number of groups.',
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(16)
  readonly numGroups?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: 'GROUP_KNOCKOUT only: how many top competitors per group advance to the knockout.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly advancePerGroup?: number;
}
