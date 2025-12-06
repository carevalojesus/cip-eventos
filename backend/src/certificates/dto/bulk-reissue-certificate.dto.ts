import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class BulkReissueCertificateDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  certificateIds: string[];

  @IsString()
  @IsNotEmpty()
  reason: string;
}
