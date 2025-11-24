import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint =
      this.configService.get<string>('MINIO_ENDPOINT') ??
      'http://localhost:9000';
    this.bucket = this.configService.get<string>('MINIO_BUCKET') ?? 'avatars';
    const region =
      this.configService.get<string>('MINIO_REGION') ?? 'us-east-1';
    const accessKeyId = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('MINIO_SECRET_KEY');

    if (!accessKeyId || !secretAccessKey) {
      throw new InternalServerErrorException(
        'Faltan credenciales MINIO_ACCESS_KEY / MINIO_SECRET_KEY',
      );
    }

    this.s3 = new S3Client({
      region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // necesario para MinIO
    });
  }

  async getAvatarUploadUrl(contentType: string) {
    if (!contentType) {
      throw new BadRequestException('contentType es requerido');
    }

    const key = `avatars/${uuidv4()}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 }); // 5 min
    const normalizedEndpoint = this.endpoint.replace(/\/$/, '');
    const publicUrl = `${normalizedEndpoint}/${this.bucket}/${key}`;

    return { uploadUrl, publicUrl, key };
  }
}
