import {
  IsEnum,
  IsString,
  IsUUID,
  IsOptional,
  IsObject,
  IsArray,
  IsIP,
} from 'class-validator';
import { AuditAction } from '../enums/audit-action.enum';
import { User } from '../../users/entities/user.entity';

export class CreateAuditLogDto {
  @IsString()
  entityType: string;

  @IsUUID()
  entityId: string;

  @IsEnum(AuditAction)
  action: AuditAction;

  @IsOptional()
  @IsObject()
  previousValues?: Record<string, any> | null;

  @IsOptional()
  @IsObject()
  newValues?: Record<string, any> | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  changedFields?: string[] | null;

  @IsOptional()
  performedBy?: User | null;

  @IsOptional()
  @IsString()
  performedByEmail?: string | null;

  @IsOptional()
  @IsIP()
  ipAddress?: string | null;

  @IsOptional()
  @IsString()
  userAgent?: string | null;

  @IsOptional()
  @IsString()
  reason?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any> | null;
}
