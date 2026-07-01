import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * OpenAPI shape of every error body produced by GlobalExceptionFilter
 * (mirrors SerializedException in libs/exceptions). One stable envelope for all 4xx/5xx.
 */
export class ApiErrorDto {
  @ApiProperty({ description: 'Human-readable error message.', example: 'Event not found' })
  readonly message!: string;

  @ApiProperty({
    description: 'Stable machine-readable error code (e.g. `EVENT.NOT_FOUND`, `HTTP.400`).',
    example: 'EVENT.NOT_FOUND',
  })
  readonly code!: string;

  @ApiPropertyOptional({ description: 'Correlation id for tracing, when available.' })
  readonly correlationId?: string;
}
