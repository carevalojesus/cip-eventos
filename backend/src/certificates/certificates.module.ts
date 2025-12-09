import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { Certificate } from './entities/certificate.entity';
import { Event } from '../events/entities/event.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { User } from '../users/entities/user.entity';
import { BlockEnrollment } from '../evaluations/entities/block-enrollment.entity';
import { PdfModule } from '../pdf/pdf.module';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Certificate,
      Event,
      Registration,
      Speaker,
      User,
      BlockEnrollment,
    ]),
    PdfModule,
    CommonModule,
    NotificationsModule,
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
