import { IsString, IsOptional, IsArray, IsEnum, IsDateString, IsInt, IsIn, Min, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectVisibility, ProjectType, LocalRemotePreference, CommitmentStyle } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ example: 'Midnight Tape' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ example: 'A collaborative neo-soul tape' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: ['Neo-Soul', 'Hindi-English'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: ['Female vocalist', 'Guitarist'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  openRoles?: string[];

  @ApiPropertyOptional({ example: 'Delhi / Bangalore' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: ProjectVisibility, default: 'DISCOVERABLE' })
  @IsOptional()
  @IsEnum(ProjectVisibility)
  visibility?: ProjectVisibility;

  @ApiPropertyOptional({ enum: ProjectType, default: 'STRUCTURED' })
  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @ApiPropertyOptional({ enum: LocalRemotePreference, default: 'BOTH' })
  @IsOptional()
  @IsEnum(LocalRemotePreference)
  localRemote?: LocalRemotePreference;

  @ApiPropertyOptional({ example: 'Looking for one vocalist for a 3-track EP. Remote-friendly, 2 week turnaround.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  roughExpectation?: string;

  @ApiPropertyOptional({ enum: CommitmentStyle, description: 'How structured/long-term this collaboration is' })
  @IsOptional()
  @IsEnum(CommitmentStyle)
  commitmentStyle?: CommitmentStyle;

  @ApiPropertyOptional({ example: '2024-03-01T00:00:00.000Z', description: 'Open collabs expire and auto-archive after this date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Origin cypher ID if this project was born after a cypher event' })
  @IsOptional()
  @IsString()
  bornFromCypherId?: string;

  @ApiPropertyOptional({ description: 'Max number of active contributors (open collabs only)', minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  participantCap?: number;

  @ApiPropertyOptional({ description: 'Creator-declared AI usage: ai-assisted, ai-generated, ai-workflow', enum: ['ai-assisted', 'ai-generated', 'ai-workflow'] })
  @IsOptional()
  @IsIn(['ai-assisted', 'ai-generated', 'ai-workflow'])
  aiDisclosureLabel?: string;
}
