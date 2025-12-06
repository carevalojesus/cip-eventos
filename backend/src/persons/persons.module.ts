import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { PersonsService } from './persons.service';
import { PersonMergeService } from './services/person-merge.service';
import { DataDeletionService } from './services/data-deletion.service';
import { PersonsController } from './persons.controller';
import { Attendee } from '../attendees/entities/attendee.entity';
import { BlockEnrollment } from '../evaluations/entities/block-enrollment.entity';
import { SessionAttendance } from '../evaluations/entities/session-attendance.entity';
import { ReniecModule } from '../reniec/reniec.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Person,
      User,
      Attendee,
      BlockEnrollment,
      SessionAttendance,
    ]),
    ReniecModule, // Importar módulo de RENIEC para validación
  ],
  controllers: [PersonsController],
  providers: [PersonsService, PersonMergeService, DataDeletionService],
  exports: [TypeOrmModule, PersonsService, PersonMergeService, DataDeletionService],
})
export class PersonsModule {}
