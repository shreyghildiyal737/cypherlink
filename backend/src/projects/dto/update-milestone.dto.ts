import { IsString, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { MilestoneStatus } from '@prisma/client';

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  assignedRole?: string;

  @IsOptional()
  @IsString()
  assignedContributorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliverableExpectation?: string;

  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;
}
