import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import {
  MessagingProvider,
  MessageResult,
  DeliveryStatus,
} from '../interfaces/messaging-provider.interface';

@Injectable()
export class TwilioProvider implements MessagingProvider {
  private readonly logger = new Logger(TwilioProvider.name);
  private client: Twilio;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not configured. SMS functionality will be disabled.');
      return;
    }

    this.client = new Twilio(accountSid, authToken);
    this.logger.log('Twilio SMS provider initialized');
  }

  async send(to: string, message: string): Promise<MessageResult> {
    if (!this.client) {
      return {
        success: false,
        errorCode: 'NOT_CONFIGURED',
        errorMessage: 'Twilio not configured',
      };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
        to: this.formatPhoneNumber(to),
      });

      this.logger.log(`SMS sent to ${to}, SID: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`, error.stack);
      return {
        success: false,
        errorCode: error.code,
        errorMessage: error.message,
      };
    }
  }

  async sendTemplate(
    to: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<MessageResult> {
    // Para SMS, reemplazar variables en el template
    const template = this.getTemplate(templateId);
    const message = this.replaceVariables(template, variables);
    return this.send(to, message);
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    if (!this.client) {
      return DeliveryStatus.FAILED;
    }

    try {
      const message = await this.client.messages(messageId).fetch();
      return this.mapStatus(message.status);
    } catch (error) {
      this.logger.error(`Failed to get delivery status for ${messageId}: ${error.message}`);
      return DeliveryStatus.FAILED;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Asegurar formato E.164 (+51...)
    if (!phone) return '';

    // Eliminar espacios y caracteres especiales
    const cleaned = phone.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('51')) return `+${cleaned}`;

    // Default Perú
    return `+51${cleaned}`;
  }

  private getTemplate(templateId: string): string {
    const templates: Record<string, string> = {
      'payment-reminder': 'CIP Eventos: Tu reserva expira pronto. Completa tu pago en: {{link}}',
      'event-reminder': 'CIP Eventos: Mañana es {{eventName}}. No olvides asistir.',
      'certificate-ready': 'CIP Eventos: Tu certificado está listo. Descárgalo en: {{link}}',
      'payment-confirmed': 'CIP Eventos: Pago confirmado para {{eventName}}. Tu código: {{ticketCode}}',
      'ticket-transfer': 'CIP Eventos: Te han transferido un ticket para {{eventName}}. Código: {{ticketCode}}',
    };

    return templates[templateId] || templateId;
  }

  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    Object.keys(variables).forEach((key) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(placeholder, variables[key]);
    });

    return result;
  }

  private mapStatus(twilioStatus: string): DeliveryStatus {
    const statusMap: Record<string, DeliveryStatus> = {
      'queued': DeliveryStatus.QUEUED,
      'sent': DeliveryStatus.SENT,
      'delivered': DeliveryStatus.DELIVERED,
      'read': DeliveryStatus.READ,
      'failed': DeliveryStatus.FAILED,
      'undelivered': DeliveryStatus.FAILED,
    };

    return statusMap[twilioStatus] || DeliveryStatus.QUEUED;
  }
}
