import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { Registration } from './entities/registration.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { EventSession } from '../events/entities/event-session.entity';
import { SessionAttendance } from '../evaluations/entities/session-attendance.entity';
import { AttendeesModule } from '../attendees/attendees.module';
import { EventsModule } from '../events/events.module';

import { CipIntegrationModule } from '../cip-integration/cip-integration.module';
import { CouponsModule } from '../coupons/coupons.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Registration,
      EventTicket,
      Attendee,
      EventSession,
      SessionAttendance,
    ]),
    AttendeesModule,
    forwardRef(() => EventsModule),
    CipIntegrationModule,
    CouponsModule,
    WaitlistModule,
    NotificationsModule,
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
