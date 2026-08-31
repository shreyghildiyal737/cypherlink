import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// These endpoints previously took inline TypeScript body types. Those are erased
// at runtime, so the global ValidationPipe had no metadata to work from and
// neither whitelist nor forbidNonWhitelisted applied - arbitrary JSON reached
// the handlers. Real classes restore both.

const REPORT_STATUSES = ['NEEDS_REVIEW', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] as const;
const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export class UpdateReportDto {
  @ApiProperty({ enum: REPORT_STATUSES })
  @IsIn(REPORT_STATUSES as readonly string[])
  status!: string;

  @ApiPropertyOptional({ description: 'Moderation action taken alongside the status change' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  action?: string;

  @ApiPropertyOptional({ description: 'Internal note - not shown to the reported user' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNote?: string;
}

/** Shared by the verification and organizer request review endpoints. */
export class UpdateRequestDto {
  @ApiProperty({ enum: REQUEST_STATUSES })
  @IsIn(REQUEST_STATUSES as readonly string[])
  status!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNote?: string;
}

export class UpdateIncidentDto {
  @ApiPropertyOptional({ description: 'Incident status, e.g. OPEN or RESOLVED' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  status?: string;

  @ApiPropertyOptional({ enum: PRIORITIES })
  @IsOptional()
  @IsIn(PRIORITIES as readonly string[])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;
}
