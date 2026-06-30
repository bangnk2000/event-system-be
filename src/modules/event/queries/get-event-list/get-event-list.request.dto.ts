import { IsIn, IsOptional } from 'class-validator';

export class GetEventListRequestDto {
  @IsOptional()
  @IsIn(['vi', 'ja'])
  readonly lang?: 'vi' | 'ja';
}
