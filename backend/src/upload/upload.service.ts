import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  async signUpload(
    folder: string,
    contentType: string,
    fileName?: string,
  ): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string; maxSize: number }> {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new BadRequestException('Storage not configured (S3_BUCKET missing)');

    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || 'us-east-1';

    const client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });

    const publicBase =
      process.env.S3_PUBLIC_URL ||
      (endpoint
        ? `${endpoint}/${bucket}`
        : `https://${bucket}.s3.${region}.amazonaws.com`);

    const ext = fileName ? fileName.split('.').pop() : this.extFromMime(contentType);
    const fileKey = `${folder}/${uuidv4()}.${ext}`;
    const maxSize = parseInt(process.env.UPLOAD_MAX_MB || '250', 10) * 1024 * 1024;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

    return {
      uploadUrl,
      fileKey,
      publicUrl: `${publicBase}/${fileKey}`,
      maxSize,
    };
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'application/pdf': 'pdf',
    };
    return map[mime] ?? 'bin';
  }
}
