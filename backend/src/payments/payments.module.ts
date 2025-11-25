import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { Registration } from '../registrations/entities/registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Registration]),
    // MailModule ya es Global, así que no hace falta importarlo aquí si tiene @Global()
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
