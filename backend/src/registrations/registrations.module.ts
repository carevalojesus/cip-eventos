import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { Registration } from './entities/registration.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { AttendeesModule } from '../attendees/attendees.module';
import { EventsModule } from '../events/events.module';

import { CipIntegrationModule } from '../cip-integration/cip-integration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, EventTicket, Attendee]),
    AttendeesModule,
    forwardRef(() => EventsModule),
    CipIntegrationModule,
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
