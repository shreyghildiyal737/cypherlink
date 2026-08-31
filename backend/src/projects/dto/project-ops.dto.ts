import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';

// Replaces inline body types, which are erased at runtime and so were never
// validated. See the note in admin-ops/dto/admin-ops.dto.ts.

export class SetFilledRolesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  filledRoles!: string[];
}

// fileKey and publicUrl are supplied by the client after it PUTs to the
// presigned URL, so they are bounded here. The server issued the key, so a
// mismatched one should not be accepted silently either - worth an ownership
// check in the service as a follow-up.
export class ConfirmFileUploadDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  fileKey!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ description: 'Size in bytes' })
  @IsInt()
  @Min(1)
  @Max(1024 * 1024 * 1024)
  fileSize!: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  mimeType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  publicUrl?: string;
}

export class OptionalNoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
