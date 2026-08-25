import { IsString, IsOptional, IsInt, IsArray, Min } from 'class-validator';

export class CreateLearningSessionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  topic: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  approximateLocation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  safetyTags?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsString()
  startsAt: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}
