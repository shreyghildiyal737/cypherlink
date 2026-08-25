import { IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageIntent } from '@prisma/client';

export class CreateMessageRequestDto {
  @ApiProperty({ example: 'uuid-of-receiver' })
  @IsString()
  receiverId: string;

  @ApiProperty({ enum: MessageIntent, example: 'COLLABORATE' })
  @IsEnum(MessageIntent)
  intent: MessageIntent;

  @ApiProperty({ example: 'Love your sound! Want to collaborate on a track?' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  message: string;
}
