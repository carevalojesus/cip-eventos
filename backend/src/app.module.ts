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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PaymentsModule } from './payments/payments.module';
import { SignersModule } from './signers/signers.module';
import { CertificatesModule } from './certificates/certificates.module';
import { PdfModule } from './pdf/pdf.module';
import { CommonModule } from './common/common.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WalletModule } from './wallet/wallet.module';
import { CipIntegrationModule } from './cip-integration/cip-integration.module';

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
    // Rate Limiting Global - Protección contra ataques DoS
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Ventana de tiempo: 60 segundos
        limit: 10, // Máximo 10 peticiones por ventana (default)
      },
    ]),
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
