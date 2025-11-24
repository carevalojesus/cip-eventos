import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserWelcome(email: string, name: string, token: string) {
    const url = `http://localhost:3000/api/auth/confirm?token=${token}`;

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
}
