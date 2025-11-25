import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsUrl,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startAt: string;

  @IsDateString()
  @IsNotEmpty()
  endAt: string;

  @IsString()
  @IsOptional()
  room?: string;

  @IsUrl()
  @IsOptional()
  meetingUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  speakersIds?: string[]; // IDs de los ponentes de esta charla
}
