import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ReportTargetType, ReportReason } from '@prisma/client';

// Replaces an inline body type. This endpoint takes abuse reports, so an
// unvalidated targetType or reason reached Prisma as an invalid enum and
// surfaced as a 500 rather than a 400.
export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  targetId!: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
