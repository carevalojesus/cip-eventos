import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private s3: S3Client | null = null;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly configService: ConfigService) {
    this.endpoint =
      this.configService.get<string>('MINIO_ENDPOINT') ??
      'http://localhost:9000';
    this.bucket = this.configService.get<string>('MINIO_BUCKET') ?? 'avatars';
  }

  async getAvatarUploadUrl(contentType: string, contentLength?: number) {
    if (!contentType) {
      throw new BadRequestException('contentType es requerido');
    }
    this.validateContentType(contentType);
    this.validateContentLength(contentLength);

    const s3 = await this.getOrCreateClient();
    await this.ensureBucketExists(s3);

    const key = `avatars/${uuidv4()}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
    const normalizedEndpoint = this.endpoint.replace(/\/$/, '');
    const publicUrl = `${normalizedEndpoint}/${this.bucket}/${key}`;

    return { uploadUrl, publicUrl, key };
  }

  private async getOrCreateClient(): Promise<S3Client> {
    if (this.s3) return this.s3;

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

    return this.s3;
  }

  private async ensureBucketExists(client: S3Client): Promise<void> {
    try {
      await client.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Bucket ${this.bucket} no encontrado, se intentará crear. Detalle: ${String(error)}`,
      );
      try {
        await client.send(
          new CreateBucketCommand({
            Bucket: this.bucket,
          }),
        );
      } catch (createError) {
        this.logger.error(
          `No se pudo crear el bucket ${this.bucket}: ${String(createError)}`,
        );
        throw new InternalServerErrorException(
          'No se pudo preparar el bucket para uploads',
        );
      }
    }
  }

  private validateContentType(contentType: string) {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(contentType)) {
      throw new BadRequestException(
        `contentType debe ser uno de: ${allowed.join(', ')}`,
      );
    }
  }

  private validateContentLength(contentLength?: number) {
    if (contentLength === undefined || contentLength === null) return;
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (contentLength > maxBytes) {
      throw new BadRequestException('El archivo excede el tamaño máximo (5MB)');
    }
  }
}
