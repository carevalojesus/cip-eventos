import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MessagingProvider } from './interfaces/messaging-provider.interface';
import { DeliveryStatus } from './interfaces/messaging-provider.interface';
import type { MessageResult } from './interfaces/messaging-provider.interface';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  private readonly smsProvider: MessagingProvider;
  private readonly whatsappProvider: MessagingProvider;

  constructor(
    @Inject('SMS_PROVIDER') smsProvider: MessagingProvider,
    @Inject('WHATSAPP_PROVIDER') whatsappProvider: MessagingProvider,
    private readonly configService: ConfigService,
  ) {
    this.smsProvider = smsProvider;
    this.whatsappProvider = whatsappProvider;
  }

  /**
   * Enviar SMS simple
   */
  async sendSms(to: string, message: string): Promise<MessageResult> {
    if (!this.isSmsEnabled()) {
      this.logger.warn('SMS is disabled. Skipping message.');
      return {
        success: false,
        errorCode: 'DISABLED',
        errorMessage: 'SMS is disabled',
      };
    }

    return this.smsProvider.send(to, message);
  }

  /**
   * Enviar SMS con template
   */
  async sendSmsTemplate(
    to: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<MessageResult> {
    if (!this.isSmsEnabled()) {
      this.logger.warn('SMS is disabled. Skipping template message.');
      return {
        success: false,
        errorCode: 'DISABLED',
        errorMessage: 'SMS is disabled',
      };
    }

    return this.smsProvider.sendTemplate(to, templateId, variables);
  }

  /**
   * Enviar mensaje de WhatsApp
   */
  async sendWhatsApp(to: string, message: string): Promise<MessageResult> {
    if (!this.isWhatsAppEnabled()) {
      this.logger.warn('WhatsApp is disabled. Skipping message.');
      return {
        success: false,
        errorCode: 'DISABLED',
        errorMessage: 'WhatsApp is disabled',
      };
    }

    return this.whatsappProvider.send(to, message);
  }

  /**
   * Enviar WhatsApp con template pre-aprobado
   */
  async sendWhatsAppTemplate(
    to: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<MessageResult> {
    if (!this.isWhatsAppEnabled()) {
      this.logger.warn('WhatsApp is disabled. Skipping template message.');
      return {
        success: false,
        errorCode: 'DISABLED',
        errorMessage: 'WhatsApp is disabled',
      };
    }

    return this.whatsappProvider.sendTemplate(to, templateId, variables);
  }

  /**
   * Enviar a múltiples canales
   */
  async sendMultiChannel(
    channels: ('SMS' | 'WHATSAPP')[],
    to: string,
    message: string,
  ): Promise<Record<string, MessageResult>> {
    const results: Record<string, MessageResult> = {};

    for (const channel of channels) {
      if (channel === 'SMS') {
        results.sms = await this.sendSms(to, message);
      } else if (channel === 'WHATSAPP') {
        results.whatsapp = await this.sendWhatsApp(to, message);
      }
    }

    return results;
  }

  /**
   * Obtener estado de entrega de un mensaje
   */
  async getSmsDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    return this.smsProvider.getDeliveryStatus(messageId);
  }

  /**
   * Obtener estado de entrega de un mensaje de WhatsApp
   */
  async getWhatsAppDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    return this.whatsappProvider.getDeliveryStatus(messageId);
  }

  /**
   * Verificar si SMS está habilitado
   */
  private isSmsEnabled(): boolean {
    return this.configService.get<boolean>('SMS_ENABLED', false);
  }

  /**
   * Verificar si WhatsApp está habilitado
   */
  private isWhatsAppEnabled(): boolean {
    return this.configService.get<boolean>('WHATSAPP_ENABLED', false);
  }

  /**
   * Métodos helper para notificaciones comunes
   */

  /**
   * Enviar recordatorio de pago pendiente
   */
  async sendPaymentReminder(phone: string, paymentLink: string): Promise<MessageResult> {
    return this.sendSmsTemplate(phone, 'payment-reminder', {
      link: paymentLink,
    });
  }

  /**
   * Enviar recordatorio de evento
   */
  async sendEventReminder(phone: string, eventName: string): Promise<MessageResult> {
    return this.sendSmsTemplate(phone, 'event-reminder', {
      eventName,
    });
  }

  /**
   * Notificar certificado disponible
   */
  async sendCertificateReady(phone: string, certificateLink: string): Promise<MessageResult> {
    return this.sendSmsTemplate(phone, 'certificate-ready', {
      link: certificateLink,
    });
  }

  /**
   * Confirmar pago por WhatsApp
   */
  async sendPaymentConfirmationWhatsApp(
    phone: string,
    eventName: string,
    ticketCode: string,
  ): Promise<MessageResult> {
    return this.sendWhatsAppTemplate(phone, 'payment-confirmed', {
      eventName,
      ticketCode,
    });
  }

  /**
   * Notificar transferencia de ticket
   */
  async sendTicketTransferNotification(
    phone: string,
    eventName: string,
    ticketCode: string,
  ): Promise<MessageResult> {
    return this.sendSmsTemplate(phone, 'ticket-transfer', {
      eventName,
      ticketCode,
    });
  }
}
