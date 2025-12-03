import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { EventType } from '../../events/entities/event-type.entity';
import { EventCategory } from '../../events/entities/event-category.entity';
import { EventModality } from '../../events/entities/event-modality.entity';
import { Organizer } from '../../organizers/entities/organizer.entity';
import { Signer } from '../../signers/entities/signer.entity';
import { Event } from '../../events/entities/event.entity';
import { EventLocation } from '../../events/entities/event-location.entity';
import { EventTicket } from '../../events/entities/event-ticket.entity';

// Services
import { InitialSeedService } from './initial-seed.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Role,
      User,
      Profile,
      EventType,
      EventCategory,
      EventModality,
      Organizer,
      Signer,
      Event,
      EventLocation,
      EventTicket,
    ]),
  ],
  providers: [InitialSeedService],
  exports: [InitialSeedService],
})
export class SeedModule {}
