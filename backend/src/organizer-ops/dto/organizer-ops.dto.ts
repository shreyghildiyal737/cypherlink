import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Replaces inline body types, which are erased at runtime and so were never
// validated. See the note in admin-ops/dto/admin-ops.dto.ts.

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export class ScanQrDto {
  @ApiProperty({ description: 'Raw QR token scanned from an attendee' })
  @IsString()
  @MinLength(16)
  @MaxLength(4096)
  qrToken!: string;
}

export class AddHighlightDto {
  @ApiProperty({ description: 'Id of the cypher asset to promote' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  assetId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;

  // Free-form rather than @IsIn: CypherHighlight has no visibility column, so
  // the accepted values are not established anywhere in the schema. Bounded
  // here rather than guessed at.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  visibility?: string;
}

export class AddSafetyNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  note!: string;

  @ApiPropertyOptional({ enum: SEVERITIES })
  @IsOptional()
  @IsIn(SEVERITIES as readonly string[])
  severity?: string;
}
