import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { Resend } from 'resend';
import { QrService } from '../common/qr.service';
import { WalletService } from '../wallet/wallet.service';
import { Registration } from '../registrations/entities/registration.entity';
import {
  renderAccountConfirmedEmail,
  renderResetPasswordEmail,
  renderTicketEmail,
  renderWelcomeEmail,
} from './templates/react-emails';
import { RESEND_CLIENT } from './resend.provider';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
    private qrService: QrService,
    private walletService: WalletService,
    @Optional() @Inject(RESEND_CLIENT) private readonly resendClient: Resend | null,
  ) {}

  private getLocale(): 'es' | 'en' {
    const ctxLang = I18nContext.current()?.lang;
    if (ctxLang?.toLowerCase().startsWith('en')) return 'en';
    return 'es';
  }

  private getFrontendPath(key: 'login' | 'confirm' | 'reset', locale: 'es' | 'en'): string {
    const map = {
      login: locale === 'en'
        ? this.configService.get<string>('FRONTEND_LOGIN_PATH_EN') ?? '/en/login'
        : this.configService.get<string>('FRONTEND_LOGIN_PATH_ES') ?? '/iniciar-sesion',
      confirm: locale === 'en'
        ? this.configService.get<string>('FRONTEND_CONFIRM_PATH_EN') ?? '/en/auth/confirm'
        : this.configService.get<string>('FRONTEND_CONFIRM_PATH_ES') ?? '/auth/confirm',
      reset: locale === 'en'
        ? this.configService.get<string>('FRONTEND_RESET_PATH_EN') ?? '/en/auth/reset-password'
        : this.configService.get<string>('FRONTEND_RESET_PATH_ES') ?? '/auth/restablecer-contrasena',
    };
    return map[key];
  }

  private buildUrl(path: string): string {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4321';

    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${normalizedBase}${normalizedPath}`;
  }

  private buildUrlWithToken(token: string, path: string): string {
    const url = this.buildUrl(path);
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
  }

  // Enviar a través del proveedor configurado (Resend o SMTP)
  private async dispatchMail(to: string, subject: string, html: string) {
    const provider = this.configService.get<string>('MAIL_PROVIDER') || 'smtp';
    const from =
      this.configService.get<string>('MAIL_FROM') ||
      'CIP Eventos <no-reply@cip-eventos.local>';

    if (provider === 'resend') {
      if (!this.resendClient) {
        this.logger.warn(
          'MAIL_PROVIDER=resend pero RESEND_API_KEY no está configurado. Usando fallback SMTP.',
        );
      } else {
        await this.resendClient.emails.send({ from, to, subject, html });
        this.logger.log(`Email enviado via Resend a ${to} (${subject})`);
        return;
      }
    }

    await this.mailerService.sendMail({
      to,
      from,
      subject,
      html,
    });
    this.logger.log(`Email enviado via SMTP a ${to} (${subject})`);
  }

  async sendUserWelcome(email: string, name: string, token: string) {
    const locale = this.getLocale();
    const confirmPath = this.getFrontendPath('confirm', locale);
    const url = this.buildUrlWithToken(token, confirmPath);

    const { subject, html } = await renderWelcomeEmail(name, url, locale);
    await this.dispatchMail(email, subject, html);
  }
  async sendPasswordReset(email: string, name: string, token: string) {
    const locale = this.getLocale();
    const resetPath = this.getFrontendPath('reset', locale);
    const url = this.buildUrlWithToken(token, resetPath);

    const { subject, html } = await renderResetPasswordEmail(name, url, locale);
    await this.dispatchMail(email, subject, html);
  }

  async sendAccountConfirmed(email: string, name: string) {
    const locale = this.getLocale();
    const loginUrl = this.buildLoginUrl(locale);
    const { subject, html } = await renderAccountConfirmedEmail(name, loginUrl, locale);
    await this.dispatchMail(email, subject, html);
  }

  private buildLoginUrl(locale: 'es' | 'en'): string {
    const loginPath = this.getFrontendPath('login', locale);
    return this.buildUrl(loginPath);
  }

  private formatDate(value?: string | Date): string {
    if (!value) return 'Por definir';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
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
        eventDate: this.formatDate(registration.event.startAt),
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
        eventDate: this.formatDate(eventDate),
        eventLocation: eventLocation || 'Por definir',
      };

      this.logger.warn(
        'sendTicket llamado con formato antiguo. Considerar usar Registration completo.',
      );
    }

    // Generar QR code
    const qrCode = await this.qrService.generateQrBase64(contextData.ticketCode);

    const safeContext = {
      name: contextData.name || 'colega',
      eventTitle: contextData.eventTitle || 'Evento',
      ticketCode: contextData.ticketCode || 'N/A',
      eventDate: this.formatDate(contextData.eventDate),
      eventLocation: contextData.eventLocation || 'Por definir',
    };

    const { subject, html } = await renderTicketEmail({
      name: safeContext.name,
      eventTitle: safeContext.eventTitle,
      ticketCode: safeContext.ticketCode,
      eventDate: safeContext.eventDate,
      eventLocation: safeContext.eventLocation,
      qrCode,
      walletLink,
    });
    await this.dispatchMail(email, subject, html);

    this.logger.log(`Ticket enviado a ${email} para ${contextData.eventTitle}`);
  }
}
