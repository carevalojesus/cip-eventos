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
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4321';
    const url = `${baseUrl}/api/auth/confirm?token=${token}`;

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
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4321';
    const url = `${baseUrl}/api/auth/reset-password?token=${token}`;

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
}
