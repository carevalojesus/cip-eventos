import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import {
  MessagingProvider,
  MessageResult,
  DeliveryStatus,
} from '../interfaces/messaging-provider.interface';

@Injectable()
export class WhatsAppProvider implements MessagingProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);
  private client: Twilio;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not configured. WhatsApp functionality will be disabled.');
      return;
    }

    this.client = new Twilio(accountSid, authToken);
    this.logger.log('WhatsApp provider initialized');
  }

  async send(to: string, message: string): Promise<MessageResult> {
    if (!this.client) {
      return {
        success: false,
        errorCode: 'NOT_CONFIGURED',
        errorMessage: 'WhatsApp not configured',
      };
    }

    try {
      const whatsappNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER');

      if (!whatsappNumber) {
        return {
          success: false,
          errorCode: 'WHATSAPP_NUMBER_NOT_CONFIGURED',
          errorMessage: 'WhatsApp number not configured',
        };
      }

      const result = await this.client.messages.create({
        body: message,
        from: `whatsapp:${whatsappNumber}`,
        to: `whatsapp:${this.formatPhoneNumber(to)}`,
      });

      this.logger.log(`WhatsApp message sent to ${to}, SID: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp to ${to}: ${error.message}`, error.stack);
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
    if (!this.client) {
      return {
        success: false,
        errorCode: 'NOT_CONFIGURED',
        errorMessage: 'WhatsApp not configured',
      };
    }

    try {
      const whatsappNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER');

      if (!whatsappNumber) {
        return {
          success: false,
          errorCode: 'WHATSAPP_NUMBER_NOT_CONFIGURED',
          errorMessage: 'WhatsApp number not configured',
        };
      }

      // WhatsApp requiere templates pre-aprobados
      // Para Twilio, usar contentSid y contentVariables
      const result = await this.client.messages.create({
        from: `whatsapp:${whatsappNumber}`,
        to: `whatsapp:${this.formatPhoneNumber(to)}`,
        contentSid: templateId, // Template SID de Twilio
        contentVariables: JSON.stringify(variables),
      });

      this.logger.log(`WhatsApp template sent to ${to}, SID: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp template to ${to}: ${error.message}`, error.stack);
      return {
        success: false,
        errorCode: error.code,
        errorMessage: error.message,
      };
    }
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
