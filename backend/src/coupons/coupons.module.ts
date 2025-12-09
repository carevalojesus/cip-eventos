import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';

import { Event } from '../events/entities/event.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { CipIntegrationModule } from '../cip-integration/cip-integration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Coupon,
      CouponUsage,
      Event,
      EventTicket,
      Attendee,
    ]),
    CipIntegrationModule,
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
