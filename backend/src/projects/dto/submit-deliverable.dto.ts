import { IsString, IsOptional, IsEnum, MaxLength, IsInt, Min } from 'class-validator';
import { RightsTag } from '@prisma/client';

export class SubmitDeliverableDto {
  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  role?: string;

  @IsOptional()
  @IsString()
  fileKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(260)
  fileName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  publicUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsEnum(RightsTag)
  rightsTag?: RightsTag;
}
