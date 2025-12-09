import { CertificateStatus } from '../entities/certificate.entity';

export interface RevocationInfo {
  revokedAt: Date;
  reason: string;
}

export interface CertificateInfo {
  type: string;
  recipientName: string;
  eventName: string;
  eventDate: string;
  hours: number;
  issuedAt: Date;
  version: number;
}

export class CertificateValidationDto {
  isValid: boolean;
  status: CertificateStatus;
  certificate?: CertificateInfo;
  revocationInfo?: RevocationInfo;
  message: string;
}
