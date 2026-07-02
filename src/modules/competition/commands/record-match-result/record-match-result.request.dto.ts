import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class RecordMatchResultRequestDto {
  @ApiProperty({ type: Number, minimum: 0, description: 'Score for competitor A.' })
  @IsInt()
  @Min(0)
  @Max(1000)
  readonly scoreA!: number;

  @ApiProperty({ type: Number, minimum: 0, description: 'Score for competitor B.' })
  @IsInt()
  @Min(0)
  @Max(1000)
  readonly scoreB!: number;

  @ApiPropertyOptional({
    description: 'Freeform breakdown for display, e.g. "21-18, 19-21, 21-15".',
    example: '21-18, 19-21, 21-15',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly detail?: string;
}
