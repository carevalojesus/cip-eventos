import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { Registration } from './entities/registration.entity';
import { AttendeesModule } from '../attendees/attendees.module';
import { EventsModule } from '../events/events.module';

import { CipIntegrationModule } from '../cip-integration/cip-integration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration]),
    AttendeesModule,
    EventsModule,
    CipIntegrationModule,
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}
