import { IsString, Matches, MaxLength, IsOptional, IsObject } from 'class-validator';

export class SendSmsDto {
  @IsString()
  @Matches(/^\+?[1-9]\d{8,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +51999999999)',
  })
  to: string;

  @IsString()
  @MaxLength(160, {
    message: 'SMS message cannot exceed 160 characters',
  })
  message: string;
}

export class SendSmsTemplateDto {
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
