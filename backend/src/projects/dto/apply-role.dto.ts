import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class ApplyRoleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  role: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
