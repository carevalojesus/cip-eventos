import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { RegistrationReportsService } from './services/registration-reports.service';
import { FinancialReportsService } from './services/financial-reports.service';
import { AcademicReportsService } from './services/academic-reports.service';
import { ExportService } from './services/export.service';
import { ScheduledReportsService } from './services/scheduled-reports.service';
import { ReportsCronService } from './services/reports-cron.service';

// Entities
import { Registration } from '../registrations/entities/registration.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { SessionAttendance } from '../evaluations/entities/session-attendance.entity';
import { BlockEnrollment } from '../evaluations/entities/block-enrollment.entity';
import { ParticipantGrade } from '../evaluations/entities/participant-grade.entity';
import { EvaluableBlock } from '../evaluations/entities/evaluable-block.entity';
import { FiscalDocument } from '../fiscal-documents/entities/fiscal-document.entity';
import { Refund } from '../refunds/entities/refund.entity';
import { ScheduledReport } from './entities/scheduled-report.entity';
import { Event } from '../events/entities/event.entity';

// Queue module
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Registration,
      Payment,
      Certificate,
      SessionAttendance,
      BlockEnrollment,
      ParticipantGrade,
      EvaluableBlock,
      FiscalDocument,
      Refund,
      ScheduledReport,
      Event,
    ]),
    QueueModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    RegistrationReportsService,
    FinancialReportsService,
    AcademicReportsService,
    ExportService,
    ScheduledReportsService,
    ReportsCronService,
  ],
  exports: [ReportsService, ScheduledReportsService],
})
export class ReportsModule {}
