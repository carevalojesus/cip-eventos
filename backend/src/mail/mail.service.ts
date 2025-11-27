import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { QrService } from '../common/qr.service';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
    private qrService: QrService,
  ) {}

  async sendUserWelcome(email: string, name: string, token: string) {
    const url = this.buildUrlWithToken(
      token,
      this.configService.get<string>('FRONTEND_CONFIRM_PATH') ||
        '/auth/confirm',
    );

    await this.mailerService.sendMail({
      to: email,
      subject: 'Bienvenido - Confirma tu cuenta',
      template: './welcome',
      context: {
        name: name,
        url: url,
      },
    });
  }
  async sendPasswordReset(email: string, name: string, token: string) {
    const url = this.buildUrlWithToken(
      token,
      this.configService.get<string>('FRONTEND_RESET_PATH') ||
        '/auth/reset-password',
    );

    await this.mailerService.sendMail({
      to: email,
      subject: 'Restablecer Contraseña',
      template: './reset-password',
      context: {
        name: name,
        url: url,
      },
    });
  }

  async sendAccountConfirmed(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: '¡Cuenta Verificada Exitosamente!',
      template: './account-confirmed',
      context: { name },
    });
  }

  private buildUrlWithToken(token: string, path: string): string {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4321';

    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${normalizedBase}${normalizedPath}?token=${token}`;
  }

  async sendTicket(
    email: string,
    name: string,
    eventTitle: string,
    ticketCode: string,
    eventDate: string,
    eventLocation: string,
  ) {
    const qrCode = await this.qrService.generateQrBase64(ticketCode);

    await this.mailerService.sendMail({
      to: email,
      subject: `Tu entrada para ${eventTitle}`,
      template: './ticket',
      context: {
        name,
        eventTitle,
        ticketCode,
        eventDate,
        eventLocation,
        qrCode,
      },
    });
  }
}
