import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { WaitlistEntry } from './entities/waitlist-entry.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Person } from '../persons/entities/person.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WaitlistEntry,
      EventTicket,
      Person,
      Registration,
    ]),
    QueueModule,
  ],
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
