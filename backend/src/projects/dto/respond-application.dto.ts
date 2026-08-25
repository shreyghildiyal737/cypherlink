import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class RespondApplicationDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
