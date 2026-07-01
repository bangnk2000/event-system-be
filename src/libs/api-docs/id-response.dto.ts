import { ApiProperty } from '@nestjs/swagger';

/**
 * OpenAPI shape of the standard "created / accepted" response — mirrors {@link IdResponse}
 * (libs/ddd). Kept here (not on IdResponse itself) so the DDD kernel stays framework-free.
 * Controllers return an `IdResponse`; this class only documents that shape for the spec.
 */
export class IdResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identifier of the affected aggregate.',
    example: '3f1a7c2e-4b6d-4e8a-9c1f-2a5b7d9e0c34',
  })
  readonly id!: string;
}
