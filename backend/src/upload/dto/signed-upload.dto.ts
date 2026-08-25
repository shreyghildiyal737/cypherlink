import { IsString, IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Explicit production allowlist — anything not listed is rejected at the DTO layer
// before a signed URL is ever generated. Executables, scripts, and binary blobs
// are not in this list and will never be accepted.
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  // Video
  'video/mp4',
  'video/webm',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  // Documents / lyrics
  'application/pdf',
  'text/plain',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const ALLOWED_FOLDERS = ['projects', 'cyphers', 'avatars', 'clips', 'sessions', 'communities'] as const;
export type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

export class CreateSignedUploadDto {
  @ApiProperty({ example: 'projects', description: `Storage folder. Must be one of: ${ALLOWED_FOLDERS.join(', ')}` })
  @IsIn(ALLOWED_FOLDERS)
  folder: string;

  @ApiProperty({
    example: 'audio/mpeg',
    description: `MIME type of the file being uploaded. Must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
  })
  @IsIn(ALLOWED_MIME_TYPES)
  contentType: string;

  @ApiPropertyOptional({ example: 'track-final.mp3' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    example: 3145728,
    description: 'File size in bytes — bound into the signed URL so larger uploads will be rejected by S3',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  contentLength?: number;
}
