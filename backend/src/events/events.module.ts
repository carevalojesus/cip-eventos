import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
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
    ]),
    AuthModule,
    forwardRef(() => RegistrationsModule),
  ],
  controllers: [EventsController],
  providers: [EventsService, EventOwnershipGuard],
  exports: [EventsService, TypeOrmModule],
})
export class EventsModule {}
