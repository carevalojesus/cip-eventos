import { IsString, Matches, MaxLength, IsOptional, IsObject } from 'class-validator';

export class SendWhatsAppDto {
  @IsString()
  @Matches(/^\+?[1-9]\d{8,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +51999999999)',
  })
  to: string;

  @IsString()
  @MaxLength(1000, {
    message: 'WhatsApp message cannot exceed 1000 characters',
  })
  message: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class SendWhatsAppTemplateDto {
  @IsString()
  @Matches(/^\+?[1-9]\d{8,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +51999999999)',
  })
  to: string;

  @IsString()
  templateId: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}
