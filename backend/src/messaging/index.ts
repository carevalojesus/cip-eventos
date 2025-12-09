/**
 * Messaging Module - Exports
 *
 * Este archivo centraliza todas las exportaciones del módulo de mensajería
 * para facilitar las importaciones en otros módulos.
 */

// Module
export { MessagingModule } from './messaging.module';

// Service
export { MessagingService } from './messaging.service';

// Controller
export { MessagingController } from './messaging.controller';

// Interfaces
export type {
  MessagingProvider,
  MessageOptions,
  MessageResult,
} from './interfaces/messaging-provider.interface';
export { DeliveryStatus } from './interfaces/messaging-provider.interface';
export type { Message } from './interfaces/message.interface';

// DTOs
export { SendSmsDto, SendSmsTemplateDto } from './dto/send-sms.dto';
export {
  SendWhatsAppDto,
  SendWhatsAppTemplateDto,
} from './dto/send-whatsapp.dto';

// Providers
export { TwilioProvider } from './providers/twilio.provider';
export { WhatsAppProvider } from './providers/whatsapp.provider';
export { MockMessagingProvider } from './providers/mock.provider';
