import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { EvaluableBlock } from './entities/evaluable-block.entity';
import { Evaluation } from './entities/evaluation.entity';
import { BlockEnrollment } from './entities/block-enrollment.entity';
import { ParticipantGrade } from './entities/participant-grade.entity';
import { SessionAttendance } from './entities/session-attendance.entity';

// Services
import { BlocksService } from './services/blocks.service';
import { EnrollmentsService } from './services/enrollments.service';
import { GradesService } from './services/grades.service';
import { AttendanceService } from './services/attendance.service';
import { StreamingTokenService } from './services/streaming-token.service';

// Controllers
import { BlocksController } from './controllers/blocks.controller';
import { EnrollmentsController } from './controllers/enrollments.controller';
import { GradesController } from './controllers/grades.controller';
import { AttendanceController } from './controllers/attendance.controller';
import { StreamingTokenController } from './controllers/streaming-token.controller';

// External entities
import { Event } from '../events/entities/event.entity';
import { EventSession } from '../events/entities/event-session.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { Registration } from '../registrations/entities/registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Evaluation entities
      EvaluableBlock,
      Evaluation,
      BlockEnrollment,
      ParticipantGrade,
      SessionAttendance,
      // External entities needed
      Event,
      EventSession,
      EventTicket,
      Speaker,
      Attendee,
      Registration,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    BlocksController,
    EnrollmentsController,
    GradesController,
    AttendanceController,
    StreamingTokenController,
  ],
  providers: [
    BlocksService,
    EnrollmentsService,
    GradesService,
    AttendanceService,
    StreamingTokenService,
  ],
  exports: [
    BlocksService,
    EnrollmentsService,
    GradesService,
    AttendanceService,
    StreamingTokenService,
  ],
})
export class EvaluationsModule {}
