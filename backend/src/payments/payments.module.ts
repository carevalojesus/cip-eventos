import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { PaypalService } from './paypal.service';
import { ChargebackService } from './services/chargeback.service';
import { FiscalDocumentsModule } from '../fiscal-documents/fiscal-documents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Certificate } from '../certificates/entities/certificate.entity';
import { Person } from '../persons/entities/person.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Registration, Certificate, Person, AuditLog]),
    FiscalDocumentsModule,
    NotificationsModule,
    // MailModule ya es Global, así que no hace falta importarlo aquí si tiene @Global()
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaypalService, ChargebackService],
  exports: [PaymentsService, ChargebackService],
})
export class PaymentsModule {}
