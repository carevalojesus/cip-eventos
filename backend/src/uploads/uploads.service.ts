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
  GetObjectCommand,
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

    const s3 = this.getOrCreateClient();
    await this.ensureBucketExists(s3);

    // Using 'uploads/' prefix to organize avatar files
    const key = `uploads/${uuidv4()}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
    const normalizedEndpoint = this.configService.get<string>('API_URL') ?? 'http://localhost:3000';
    
    // Return proxy URL instead of direct MinIO URL
    const publicUrl = `${normalizedEndpoint}/uploads/public/${key}`;

    return { uploadUrl, publicUrl, key };
  }

  async getSignedUrl(key: string): Promise<string> {
    const s3 = this.getOrCreateClient();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string,
    folder = 'certificates',
  ): Promise<string> {
    const s3 = this.getOrCreateClient();
    await this.ensureBucketExists(s3);

    const key = `${folder}/${uuidv4()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3.send(command);

    await s3.send(command);

    const normalizedEndpoint = this.configService.get<string>('API_URL') ?? 'http://localhost:3000';
    
    // Determine if folder is public or private
    // Currently only 'events' is considered public for this example, or we can make everything private by default
    // and expose specific endpoints.
    // Based on requirements: "Profile photos, payment evidence, and CSV padrón backups are therefore accessible without auth."
    // We want to secure these.
    
    const isPublic = folder === 'events'; // Only event images are public
    const accessType = isPublic ? 'public' : 'private';

    return `${normalizedEndpoint}/uploads/${accessType}/${key}`;
  }

  async uploadEventImage(
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    return this.uploadFile(buffer, filename, contentType, 'events');
  }

  private getOrCreateClient(): S3Client {
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
