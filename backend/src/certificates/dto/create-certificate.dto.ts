import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { CertificateType } from '../entities/certificate.entity';

export class CreateCertificateDto {
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @IsEnum(CertificateType)
  @IsNotEmpty()
  type: CertificateType;

  @IsUUID()
  @IsOptional()
  registrationId?: string;

  @IsUUID()
  @IsOptional()
  speakerId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
