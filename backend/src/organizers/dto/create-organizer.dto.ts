import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateOrganizerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsUrl()
  @IsOptional()
  website?: string;
}
