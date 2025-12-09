import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduledReportDto } from './create-scheduled-report.dto';

export class UpdateScheduledReportDto extends PartialType(
  CreateScheduledReportDto,
) {}
