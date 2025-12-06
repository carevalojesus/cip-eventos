import { IsNotEmpty, IsString } from 'class-validator';

export class ReissueCertificateDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
