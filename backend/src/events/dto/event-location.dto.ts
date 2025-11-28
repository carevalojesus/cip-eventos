import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class EventLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsUrl({}, { message: 'Map link must be a valid URL' })
  @IsOptional()
  mapLink?: string;
}
