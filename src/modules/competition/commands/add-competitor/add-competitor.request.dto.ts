import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddCompetitorRequestDto {
  @ApiProperty({ format: 'uuid', description: 'A REGISTERED registration of this event to enter.' })
  @IsUUID()
  readonly registrationId!: string;
}
