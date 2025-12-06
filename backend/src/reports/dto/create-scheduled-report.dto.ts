import {
  IsString,
  IsEnum,
  IsArray,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsObject,
  IsUUID,
  IsNotEmpty,
  ArrayMinSize,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ReportType } from '../enums/report-type.enum';
import { ReportFrequency } from '../enums/report-frequency.enum';
import { ReportFormat } from '../enums/report-format.enum';

export class CreateScheduledReportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  eventId?: string;

  @IsEnum(ReportType)
  reportType: ReportType;

  @IsEnum(ReportFrequency)
  frequency: ReportFrequency;

  @IsEnum(ReportFormat)
  format: ReportFormat;

  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  recipients: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsObject()
  @IsOptional()
  config?: {
    dateFrom?: string;
    dateTo?: string;
    status?: string[];
    ticketTypes?: string[];
    scheduleTime?: string;
    weekDay?: number;
    monthDay?: number;
    timezone?: string;
    includeCharts?: boolean;
    includeComparison?: boolean;
    groupBy?: string;
  };
}
