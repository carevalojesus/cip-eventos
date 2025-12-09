import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PaymentAttempt } from './entities/payment-attempt.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { Person } from '../persons/entities/person.entity';
import { CipIntegrationModule } from '../cip-integration/cip-integration.module';
import { CouponsModule } from '../coupons/coupons.module';
import { QueueModule } from '../queue/queue.module';
import { PendingOrdersLimitGuard } from '../common/guards/pending-orders-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PaymentAttempt,
      Registration,
      EventTicket,
      Attendee,
      Person,
    ]),
    CipIntegrationModule,
    CouponsModule,
    QueueModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PendingOrdersLimitGuard],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
