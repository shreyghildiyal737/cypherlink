import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { ALLOWED_MIME_TYPES } from './dto/signed-upload.dto';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);

  onModuleInit() {
    if (process.env.NODE_ENV === 'production' && !process.env.S3_PUBLIC_URL) {
      this.logger.warn(
        'S3_PUBLIC_URL is not set. Presigned URLs will use the path-style S3_ENDPOINT, ' +
        'which may expose internal hostnames. Set S3_PUBLIC_URL to your CDN or public bucket URL.',
      );
    }
  }

  private buildClient(): { client: S3Client; bucket: string; endpoint?: string; region: string } {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new BadRequestException('Storage not configured (S3_BUCKET missing)');
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || 'us-east-1';

    // Falling back to '' built a client that fails on every call with an opaque
    // SDK error. Say which variable is missing instead.
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (!accessKeyId || !secretAccessKey) {
      throw new BadRequestException(
        'Storage not configured (S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY missing)',
      );
    }

    const client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: { accessKeyId, secretAccessKey },
    });
    return { client, bucket, endpoint, region };
  }

  async signUpload(
    folder: string,
    contentType: string,
    // Accepted so existing clients keep validating under forbidNonWhitelisted,
    // but deliberately not used - see the fileKey comment below.
    _fileName?: string,
    contentLength?: number,
  ): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string; maxSize: number; expectedContentLength?: number }> {
    const { client, bucket, endpoint, region } = this.buildClient();

    const publicBase =
      process.env.S3_PUBLIC_URL ||
      (endpoint
        ? `${endpoint}/${bucket}`
        : `https://${bucket}.s3.${region}.amazonaws.com`);

    // Defense-in-depth: DTO @IsIn() is the first gate; this is the second.
    // Runs before the key is built so the extension can be derived from a
    // type we have already accepted.
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(contentType)) {
      throw new BadRequestException(`File type not allowed: ${contentType}`);
    }

    // The extension comes from the validated content type, never from the
    // caller's fileName. Trusting fileName let an allowed type (image/jpeg) be
    // stored under an arbitrary extension - ".html" against a bucket that
    // serves by extension is stored XSS - and a name whose last dot is followed
    // by a slash put caller-controlled path segments into the key.
    const ext = this.extFromMime(contentType);
    const fileKey = `${folder}/${uuidv4()}.${ext}`;
    const defaultMb = folder === 'avatars' ? 5 : parseInt(process.env.UPLOAD_MAX_MB || '250', 10);
    const maxSize = defaultMb * 1024 * 1024;

    if (contentLength !== undefined) {
      if (contentLength <= 0) throw new BadRequestException('contentLength must be positive');
      if (contentLength > maxSize) {
        throw new BadRequestException(`File too large — limit is ${Math.floor(maxSize / (1024 * 1024))}MB`);
      }
    }

    // Binding ContentLength into the signed PUT means the client cannot upload
    // a larger file than declared. If contentLength is omitted (legacy callers),
    // size is only enforced at the application layer on confirm.
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType,
      ...(contentLength !== undefined ? { ContentLength: contentLength } : {}),
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

    return {
      uploadUrl,
      fileKey,
      publicUrl: `${publicBase}/${fileKey}`,
      maxSize,
      expectedContentLength: contentLength,
    };
  }

  async deleteObjects(fileKeys: string[]): Promise<void> {
    if (!fileKeys.length) return;
    if (!process.env.S3_BUCKET) {
      this.logger.warn('S3_BUCKET not configured — skipping storage deletion');
      return;
    }

    const { client, bucket } = this.buildClient();

    // DeleteObjects accepts up to 1000 keys per request
    for (let i = 0; i < fileKeys.length; i += 1000) {
      const batch = fileKeys.slice(i, i + 1000);
      const command = new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      });
      await client.send(command);
    }
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
