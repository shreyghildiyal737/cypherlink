import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UploadService } from './upload.service';
import { CreateSignedUploadDto } from './dto/signed-upload.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('sign')
  @ApiOperation({ summary: 'Get a presigned S3/MinIO PUT URL for direct browser upload' })
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  signUpload(@Body() dto: CreateSignedUploadDto, @CurrentUser('sub') _userId: string) {
    return this.uploadService.signUpload(dto.folder, dto.contentType, dto.fileName, dto.contentLength);
  }
}
