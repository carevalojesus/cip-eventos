import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { Refund } from './entities/refund.entity';
import { RefundPolicy } from './entities/refund-policy.entity';

import { Registration } from '../registrations/entities/registration.entity';
import { Payment } from '../payments/entities/payment.entity';
import { FiscalDocumentsModule } from '../fiscal-documents/fiscal-documents.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Refund, RefundPolicy, Registration, Payment]),
    FiscalDocumentsModule,
    NotificationsModule,
  ],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}
