import { IsString, IsOptional, IsEnum, IsDateString, IsArray, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunitySessionType } from '@prisma/client';

export class CreateCommunitySessionDto {
  @ApiProperty({ example: 'Bangalore Scene Cleanup' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CommunitySessionType })
  @IsEnum(CommunitySessionType)
  type: CommunitySessionType;

  @ApiProperty({ example: 'Bangalore' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Cubbon Park' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ example: 'Near Cubbon Park metro, South gate' })
  @IsOptional()
  @IsString()
  approximateLocation?: string;

  @ApiPropertyOptional({ type: [String], example: ['Daylight', 'Community moderated'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  safetyTags?: string[];

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty()
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
