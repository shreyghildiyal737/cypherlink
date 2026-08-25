import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateClipDto {
  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @MaxLength(100)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  projectTitle?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsUUID()
  cypherId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  communitySessionId?: string;
}
