import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteProjectMemberDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ example: 'vocalist' })
  @IsOptional()
  @IsString()
  role?: string;
}
