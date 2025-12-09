import { ReportType } from '../enums/report-type.enum';
import { ReportFrequency } from '../enums/report-frequency.enum';
import { ReportFormat } from '../enums/report-format.enum';

export class ScheduledReportResponseDto {
  id: string;
  name: string;
  description?: string;
  eventId?: string;
  eventTitle?: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  format: ReportFormat;
  recipients: string[];
  isActive: boolean;
  lastSentAt?: Date;
  nextScheduledAt?: Date;
  executionCount: number;
  failureCount: number;
  lastError?: string;
  config?: any;
  createdBy: {
    id: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
