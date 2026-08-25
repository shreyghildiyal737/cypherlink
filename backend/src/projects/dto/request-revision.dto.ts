import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class RequestRevisionDto {
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  note: string;

  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsOptional()
  @IsString()
  deliverableId?: string;
}
