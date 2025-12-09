import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourtesiesController } from './courtesies.controller';
import { CourtesiesService } from './courtesies.service';
import { Courtesy } from './entities/courtesy.entity';
import { Event } from '../events/entities/event.entity';
import { Person } from '../persons/entities/person.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { BlockEnrollment } from '../evaluations/entities/block-enrollment.entity';
import { EvaluableBlock } from '../evaluations/entities/evaluable-block.entity';
import { PersonsModule } from '../persons/persons.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Courtesy,
      Event,
      Person,
      Attendee,
      Speaker,
      Registration,
      BlockEnrollment,
      EvaluableBlock,
    ]),
    PersonsModule,
    QueueModule,
  ],
  controllers: [CourtesiesController],
  providers: [CourtesiesService],
  exports: [CourtesiesService],
})
export class CourtesiesModule {}
