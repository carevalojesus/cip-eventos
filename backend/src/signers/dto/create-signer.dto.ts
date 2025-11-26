import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSignerDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  signatureUrl: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
