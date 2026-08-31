import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

// This endpoint is @Public, so it is the inline-body-type case that mattered
// most: with a TypeScript type the global ValidationPipe had nothing to
// validate against, and unauthenticated input reached the handler unchecked.
export class ScanProfileDto {
  @ApiProperty({ description: 'Signed profile QR token' })
  @IsString()
  @MinLength(16)
  @MaxLength(4096)
  profileToken!: string;
}
