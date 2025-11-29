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
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        const synchronize =
          !isProd && (configService.get<boolean>('DB_SYNC') ?? false);

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize,
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
    RolesModule,
    UsersModule,
    AuthModule,
    MailModule,
    ProfilesModule,
    UploadsModule,
    EventsModule,
    SpeakersModule,
    OrganizersModule,
    AttendeesModule,
    RegistrationsModule,
    PaymentsModule,
    SignersModule,
    CertificatesModule,
    PdfModule,
    CommonModule,
    ScheduleModule.forRoot(),
    WalletModule,
    CipIntegrationModule,
    DashboardModule,
    NotificationsModule,
    RedisModule,
    QueueModule,

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
