export interface MessagingProvider {
  send(to: string, message: string, options?: MessageOptions): Promise<MessageResult>;
  sendTemplate(to: string, templateId: string, variables: Record<string, string>): Promise<MessageResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
}

export interface MessageOptions {
  mediaUrl?: string;      // Para MMS o WhatsApp con imagen
  templateId?: string;    // Para templates de WhatsApp
  variables?: Record<string, string>;
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export enum DeliveryStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}
