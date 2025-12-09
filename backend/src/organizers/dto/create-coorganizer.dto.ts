import {
  IsUUID,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { CoorganizerRole } from '../enums/coorganizer-role.enum';

export class CreateCoorganizerDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  organizerId: string;

  @IsEnum(CoorganizerRole)
  @IsOptional()
  role?: CoorganizerRole = CoorganizerRole.OTHER;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number = 0;

  @IsBoolean()
  @IsOptional()
  showInCertificate?: boolean = true;

  @IsBoolean()
  @IsOptional()
  showInPublicPage?: boolean = true;

  @IsString()
  @IsOptional()
  customRole?: string;
}
