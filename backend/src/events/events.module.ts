import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventCategory,
      EventModality,
      EventType,
      User,
    ]),
    AuthModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventOwnershipGuard],
})
export class EventsModule {}
