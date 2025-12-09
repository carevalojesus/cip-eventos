import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

export const RESEND_CLIENT = 'RESEND_CLIENT';

export const ResendProvider = {
  provide: RESEND_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const apiKey = configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      return null;
    }
    return new Resend(apiKey);
  },
};
