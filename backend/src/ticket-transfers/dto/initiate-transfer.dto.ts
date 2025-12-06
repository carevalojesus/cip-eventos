import { IsString, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { DocumentType } from '../../common/enums/document-type.enum';

export class InitiateTransferDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  email: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @MinLength(6)
  documentNumber: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
