import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  key: string;

  @IsString()
  @IsOptional()
  value?: string;
}

export class UpdateSettingsDto {
  @IsObject()
  settings: Record<string, string | number | boolean>;
}

export class OrganizationSettingsDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  shortName?: string;

  @IsString()
  @IsOptional()
  ruc?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  website?: string;
}

export class EmailSettingsDto {
  @IsString()
  @IsOptional()
  provider?: 'resend' | 'smtp';

  @IsString()
  @IsOptional()
  resendApiKey?: string;

  @IsString()
  @IsOptional()
  smtpHost?: string;

  @IsString()
  @IsOptional()
  smtpPort?: string;

  @IsString()
  @IsOptional()
  smtpUser?: string;

  @IsString()
  @IsOptional()
  smtpPass?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  fromEmail?: string;
}
