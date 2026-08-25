import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CypherType } from '@prisma/client';

export class CreateCypherDto {
  @ApiProperty({ example: 'Delhi Rooftop Sessions' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CypherType, default: 'OPEN' })
  @IsEnum(CypherType)
  type: CypherType;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'South Delhi rooftop' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiProperty()
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  quota?: number;

  @ApiPropertyOptional({ example: ['Community moderated', 'Optional check-in'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  safetyTags?: string[];
}
