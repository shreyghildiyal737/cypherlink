import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ScanSessionCheckInDto {
  @ApiProperty({ description: 'The raw check-in token from the attendee QR' })
  @IsString()
  @MinLength(16)
  token!: string;
}
