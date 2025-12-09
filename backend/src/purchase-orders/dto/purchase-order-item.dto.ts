import {
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '../../attendees/entities/attendee.entity';

export class AttendeeDataDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  documentNumber: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cipCode?: string;
}

export class PurchaseOrderItemDto {
  @IsUUID()
  ticketId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  // Datos del asistente para cada entrada
  @ValidateNested({ each: true })
  @Type(() => AttendeeDataDto)
  attendees: AttendeeDataDto[];

  @IsOptional()
  @IsString()
  couponCode?: string;
}
