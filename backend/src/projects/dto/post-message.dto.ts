import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class PostProjectMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;

  @IsOptional()
  @IsString()
  linkedMilestoneId?: string;

  @IsOptional()
  @IsString()
  linkedDeliverableId?: string;
}
