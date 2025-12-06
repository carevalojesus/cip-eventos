import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrService } from './qr.service';
import { PendingOrdersLimitGuard } from './guards/pending-orders-limit.guard';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { ConsentLog } from './entities/consent-log.entity';
import { ConsentService } from './services/consent.service';
import { ConsentController } from './controllers/consent.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder, ConsentLog])],
  controllers: [ConsentController],
  providers: [QrService, PendingOrdersLimitGuard, ConsentService],
  exports: [QrService, PendingOrdersLimitGuard, ConsentService],
})
export class CommonModule {}
