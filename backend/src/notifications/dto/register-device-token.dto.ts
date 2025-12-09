import { IsString, IsEnum, IsOptional } from 'class-validator';
import {
  DevicePlatform,
  TokenProvider,
} from '../entities/device-token.entity';

export class RegisterDeviceTokenDto {
  @IsString()
  token: string;

  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @IsEnum(TokenProvider)
  @IsOptional()
  provider?: TokenProvider = TokenProvider.FCM;

  @IsString()
  @IsOptional()
  deviceName?: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;

  @IsString()
  @IsOptional()
  osVersion?: string;

  @IsString()
  @IsOptional()
  appVersion?: string;
}

export class UnregisterDeviceTokenDto {
  @IsString()
  token: string;
}
