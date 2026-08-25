import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'Hey! Check out this beat I made.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}
