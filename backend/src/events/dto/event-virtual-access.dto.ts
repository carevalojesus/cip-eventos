import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class EventVirtualAccessDto {
  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsUrl({}, { message: 'Meeting URL must be a valid URL' })
  @IsNotEmpty()
  meetingUrl: string;

  @IsString()
  @IsOptional()
  meetingPassword?: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}
