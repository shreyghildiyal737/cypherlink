import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Replaces inline body types, which are erased at runtime and so were never
// validated. See the note in admin-ops/dto/admin-ops.dto.ts.

export class SetRsvpIntentDto {
  @ApiPropertyOptional({ description: 'What you intend to bring to the cypher' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  intentNote?: string;

  @ApiPropertyOptional({ description: 'Name to appear under instead of your display name' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  aliasName?: string;
}

export class CreateProjectFromCypherDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  openRoles?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];
}
