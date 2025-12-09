import { IsNotEmpty, IsString } from 'class-validator';

export class RevokeCertificateDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
