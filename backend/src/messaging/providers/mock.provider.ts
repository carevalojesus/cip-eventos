import { Injectable, Logger } from '@nestjs/common';
import {
  MessagingProvider,
  MessageResult,
  DeliveryStatus,
} from '../interfaces/messaging-provider.interface';

/**
 * Mock provider para desarrollo y testing
 * No envía mensajes reales, solo los registra en el log
 */
@Injectable()
export class MockMessagingProvider implements MessagingProvider {
  private readonly logger = new Logger(MockMessagingProvider.name);

  async send(to: string, message: string): Promise<MessageResult> {
    this.logger.log(`[MOCK] Sending message to ${to}: ${message}`);

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async sendTemplate(
    to: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<MessageResult> {
    this.logger.log(
      `[MOCK] Sending template ${templateId} to ${to}`,
      JSON.stringify(variables, null, 2),
    );

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    this.logger.log(`[MOCK] Getting delivery status for ${messageId}`);
    return DeliveryStatus.DELIVERED;
  }
}
