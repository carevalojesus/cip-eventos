import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketTransfersService } from './ticket-transfers.service';
import { TicketTransfersController } from './ticket-transfers.controller';
import { TicketTransfer } from './entities/ticket-transfer.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { Person } from '../persons/entities/person.entity';
import { SessionAttendance } from '../evaluations/entities/session-attendance.entity';
import { BlockEnrollment } from '../evaluations/entities/block-enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TicketTransfer,
      Registration,
      Attendee,
      Person,
      SessionAttendance,
      BlockEnrollment,
    ]),
  ],
  controllers: [TicketTransfersController],
  providers: [TicketTransfersService],
  exports: [TicketTransfersService],
})
export class TicketTransfersModule {}
