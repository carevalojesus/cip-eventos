import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { QrService } from '../common/qr.service';
import { WalletService } from '../wallet/wallet.service';
import { Registration } from '../registrations/entities/registration.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
    private qrService: QrService,
    private walletService: WalletService,
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

  /**
   * Envía email con ticket de evento
   * Soporta dos formatos:
   * 1. Formato nuevo: pasar objeto registration completo (recomendado)
   * 2. Formato antiguo: pasar parámetros individuales (para compatibilidad)
   */
  async sendTicket(
    emailOrRegistration: string | Registration,
    name?: string,
    eventTitle?: string,
    ticketCode?: string,
    eventDate?: string,
    eventLocation?: string,
  ) {
    let email: string;
    let contextData: any;
    let walletLink: string | null = null;

    // Determinar si se pasó un objeto Registration o parámetros individuales
    if (typeof emailOrRegistration === 'object') {
      // Formato nuevo: Registration completo
      const registration = emailOrRegistration;

      email = registration.attendee.email;
      contextData = {
        name: registration.attendee.firstName,
        eventTitle: registration.event.title,
        ticketCode: registration.ticketCode,
        eventDate: registration.event.startAt.toString(),
        eventLocation: registration.event.location?.address || 'Virtual',
      };

      // Generar link de Google Wallet
      try {
        walletLink = await this.walletService.createWalletLink(registration);
        this.logger.log(`Google Wallet link generado para ${registration.id}`);
      } catch (error) {
        this.logger.warn(
          `No se pudo generar Google Wallet link: ${error.message}`,
        );
        // Continuar sin el link de wallet
      }
    } else {
      // Formato antiguo: parámetros individuales
      email = emailOrRegistration;
      contextData = {
        name,
        eventTitle,
        ticketCode,
        eventDate,
        eventLocation,
      };

      this.logger.warn(
        'sendTicket llamado con formato antiguo. Considerar usar Registration completo.',
      );
    }

    // Generar QR code
    const qrCode = await this.qrService.generateQrBase64(contextData.ticketCode);

    // Enviar email con todos los datos
    await this.mailerService.sendMail({
      to: email,
      subject: `Tu entrada para ${contextData.eventTitle}`,
      template: './ticket',
      context: {
        ...contextData,
        qrCode,
        walletLink, // Puede ser null si no se pudo generar
      },
    });

    this.logger.log(`Ticket enviado a ${email} para ${contextData.eventTitle}`);
  }
}
