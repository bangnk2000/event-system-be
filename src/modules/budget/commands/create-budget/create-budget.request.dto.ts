import { IsOptional, IsString, Length } from 'class-validator';

export class CreateBudgetRequestDto {
  @IsOptional()
  @IsString()
  @Length(3, 10)
  readonly currency?: string;
}
