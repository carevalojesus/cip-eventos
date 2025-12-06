import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsCronService } from './events-cron.service';
import { Event } from './entities/event.entity';
import { EventCategory } from './entities/event-category.entity';
import { EventModality } from './entities/event-modality.entity';
import { EventType } from './entities/event-type.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { EventOwnershipGuard } from './guards/event-ownership.guard';
import { EventLocation } from './entities/event-location.entity';
import { EventVirtualAccess } from './entities/event-virtual-access.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { Organizer } from '../organizers/entities/organizer.entity';
import { EventTicket } from './entities/event-ticket.entity';
import { EventSession } from './entities/event-session.entity';
import { Signer } from '../signers/entities/signer.entity';
import { RegistrationsModule } from '../registrations/registrations.module';
import { UploadsModule } from '../uploads/uploads.module';
import { Registration } from '../registrations/entities/registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventCategory,
      EventModality,
      EventType,
      EventLocation,
      EventVirtualAccess,
      User,
      Speaker,
      Organizer,
      EventTicket,
      EventSession,
      Signer,
      Registration,
    ]),
    AuthModule,
    forwardRef(() => RegistrationsModule),
    UploadsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsCronService, EventOwnershipGuard],
  exports: [EventsService, TypeOrmModule],
})
export class EventsModule {}
