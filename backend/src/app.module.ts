import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { MailModule } from './mail/mail.module';
import { ProfilesModule } from './profiles/profiles.module';
import { UploadsModule } from './uploads/uploads.module';
import { validate } from './config/env.validation';
import { EventsModule } from './events/events.module';
import { SpeakersModule } from './speakers/speakers.module';
import { OrganizersModule } from './organizers/organizers.module';
import { AttendeesModule } from './attendees/attendees.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { PaymentsModule } from './payments/payments.module';
import { SignersModule } from './signers/signers.module';
import { CertificatesModule } from './certificates/certificates.module';
import { PdfModule } from './pdf/pdf.module';
import { CommonModule } from './common/common.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WalletModule } from './wallet/wallet.module';
import { CipIntegrationModule } from './cip-integration/cip-integration.module';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { SeedModule } from './database/seeds/seed.module';
import { CouponsModule } from './coupons/coupons.module';
import { FiscalDocumentsModule } from './fiscal-documents/fiscal-documents.module';
import { RefundsModule } from './refunds/refunds.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { PersonsModule } from './persons/persons.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { TicketTransfersModule } from './ticket-transfers/ticket-transfers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { AuditModule } from './audit/audit.module';
import { CourtesiesModule } from './courtesies/courtesies.module';
import { MessagingModule } from './messaging/messaging.module';
import { ReniecModule } from './reniec/reniec.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: false, // Desactivado - usar migraciones en su lugar
        };
      },
    }),
    // Rate Limiting distribuido con Redis
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD', '');
        const redisDb = configService.get<number>('REDIS_DB', 0);

        const redisInstance = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword || undefined,
          db: redisDb,
        });

        return {
          throttlers: [
            {
              name: 'short',
              ttl: seconds(1), // 1 segundo
              limit: 3, // 3 peticiones por segundo (protección burst)
            },
            {
              name: 'medium',
              ttl: seconds(10), // 10 segundos
              limit: 20, // 20 peticiones cada 10 segundos
            },
            {
              name: 'long',
              ttl: seconds(60), // 60 segundos
              limit: 100, // 100 peticiones por minuto
            },
          ],
          storage: new ThrottlerStorageRedisService(redisInstance),
        };
      },
    }),
    // Módulos de infraestructura (primero)
    RolesModule,
    UsersModule,
    AuthModule,
    MailModule,
    MessagingModule,
    ProfilesModule,
    UploadsModule,
    CommonModule,
    ScheduleModule.forRoot(),
    RedisModule,
    QueueModule,
    SeedModule,

    // Módulo de Auditoría (Global - debe estar antes de módulos que lo usen)
    AuditModule,

    // Módulos de negocio
    EventsModule,
    SpeakersModule,
    OrganizersModule,
    AttendeesModule,
    RegistrationsModule,
    PaymentsModule,
    SignersModule,
    CertificatesModule,
    PdfModule,
    WalletModule,
    CipIntegrationModule,
    DashboardModule,
    NotificationsModule,
    CouponsModule,
    FiscalDocumentsModule,
    RefundsModule,
    EvaluationsModule,
    PersonsModule,
    WaitlistModule,
    TicketTransfersModule,
    PurchaseOrdersModule,
    CourtesiesModule,
    ReniecModule,
    ReportsModule,

    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] }, // ?lang=en
        AcceptLanguageResolver, // Header 'Accept-Language'
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
