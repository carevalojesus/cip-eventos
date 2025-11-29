import { Global, Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProcessor } from './processors/email.processor';
import { EmailQueueService } from './services/email-queue.service';
import { RegistrationsModule } from '../registrations/registrations.module';
import { QUEUE_NAMES } from './constants';

@Global()
@Module({
  imports: [
    forwardRef(() => RegistrationsModule),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: configService.get<number>('REDIS_DB', 0),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 24 * 3600, // 24 horas
            count: 100,
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // 7 días
          },
        },
      }),
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMAIL,
    }),
  ],
  providers: [EmailProcessor, EmailQueueService],
  exports: [EmailQueueService, BullModule],
})
export class QueueModule {}
