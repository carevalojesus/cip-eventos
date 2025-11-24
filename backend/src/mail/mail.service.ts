import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
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
}
