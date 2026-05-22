import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSignedUploadDto {
  @ApiProperty({ example: 'projects', description: 'Storage folder/prefix (e.g. projects, cyphers, avatars)' })
  @IsString()
  folder: string;

  @ApiProperty({ example: 'audio/mpeg', description: 'MIME type of the file being uploaded' })
  @IsString()
  contentType: string;

  @ApiPropertyOptional({ example: 'track-final.mp3' })
  @IsOptional()
  @IsString()
  fileName?: string;
}
