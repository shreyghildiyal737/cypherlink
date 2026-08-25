import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProjectType } from '@prisma/client';

export class TransitionTypeDto {
  @IsEnum(ProjectType)
  projectType: ProjectType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
