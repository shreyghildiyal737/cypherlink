import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateNested } from 'class-validator';

// Replaces inline body types, which are erased at runtime and so were never
// validated. See the note in admin-ops/dto/admin-ops.dto.ts.

export class PushKeysDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  p256dh!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  auth!: string;
}

export class SubscribePushDto {
  @ApiProperty({ description: 'Push service endpoint URL from the browser' })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  endpoint!: string;

  @ApiProperty({ type: PushKeysDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;

  // The client posts PushSubscription.toJSON() verbatim, which always carries
  // expirationTime (usually null). It must be declared or forbidNonWhitelisted
  // rejects every real subscription. Accepted and ignored.
  @ApiPropertyOptional({ nullable: true, description: 'Ignored; present in PushSubscription.toJSON()' })
  @IsOptional()
  @IsNumber()
  expirationTime?: number | null;
}

export class UnsubscribePushDto {
  @ApiProperty()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  endpoint!: string;
}
