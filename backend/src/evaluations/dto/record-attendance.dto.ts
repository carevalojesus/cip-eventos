import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AttendanceStatus,
  AttendanceModality,
} from '../entities/session-attendance.entity';

export class RecordAttendanceDto {
  @IsUUID()
  sessionId: string;

  @IsUUID()
  attendeeId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsEnum(AttendanceModality)
  modality?: AttendanceModality;

  @IsOptional()
  @IsDateString()
  checkInAt?: string;

  @IsOptional()
  @IsDateString()
  checkOutAt?: string;

  @IsOptional()
  @IsString()
  excuseReason?: string;

  @IsOptional()
  @IsString()
  excuseDocumentUrl?: string;
}

class AttendanceEntry {
  @IsUUID()
  attendeeId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsEnum(AttendanceModality)
  modality?: AttendanceModality;
}

export class BatchRecordAttendanceDto {
  @IsUUID()
  sessionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntry)
  attendances: AttendanceEntry[];
}

export class CheckInDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  ticketCode: string; // Código QR del ticket

  @IsOptional()
  @IsEnum(AttendanceModality)
  modality?: AttendanceModality;
}
