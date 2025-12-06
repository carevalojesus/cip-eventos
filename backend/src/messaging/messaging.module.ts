import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { TwilioProvider } from './providers/twilio.provider';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { MockMessagingProvider } from './providers/mock.provider';

@Global()
@Module({
  controllers: [MessagingController],
  providers: [
    MessagingService,
    {
      provide: 'SMS_PROVIDER',
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        const useMock = nodeEnv !== 'production' || !configService.get<string>('TWILIO_ACCOUNT_SID');

        if (useMock) {
          return new MockMessagingProvider();
        }

        return new TwilioProvider(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: 'WHATSAPP_PROVIDER',
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        const useMock = nodeEnv !== 'production' || !configService.get<string>('TWILIO_ACCOUNT_SID');

        if (useMock) {
          return new MockMessagingProvider();
        }

        return new WhatsAppProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [MessagingService],
})
export class MessagingModule {}
