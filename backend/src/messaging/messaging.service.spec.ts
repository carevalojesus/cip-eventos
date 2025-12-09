import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { MockMessagingProvider } from './providers/mock.provider';

describe('MessagingService', () => {
  let service: MessagingService;
  let mockProvider: MockMessagingProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    mockProvider = new MockMessagingProvider();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: 'SMS_PROVIDER',
          useValue: mockProvider,
        },
        {
          provide: 'WHATSAPP_PROVIDER',
          useValue: mockProvider,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                SMS_ENABLED: true,
                WHATSAPP_ENABLED: true,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendSms', () => {
    it('should send SMS successfully', async () => {
      const result = await service.sendSms('+51999999999', 'Test message');

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should return error when SMS is disabled', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);

      const result = await service.sendSms('+51999999999', 'Test message');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DISABLED');
    });
  });

  describe('sendSmsTemplate', () => {
    it('should send SMS template successfully', async () => {
      const result = await service.sendSmsTemplate(
        '+51999999999',
        'payment-reminder',
        { link: 'https://example.com' },
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('sendWhatsApp', () => {
    it('should send WhatsApp message successfully', async () => {
      const result = await service.sendWhatsApp('+51999999999', 'Test message');

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should return error when WhatsApp is disabled', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);

      const result = await service.sendWhatsApp('+51999999999', 'Test message');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DISABLED');
    });
  });

  describe('sendWhatsAppTemplate', () => {
    it('should send WhatsApp template successfully', async () => {
      const result = await service.sendWhatsAppTemplate(
        '+51999999999',
        'payment-confirmed',
        { eventName: 'Test Event', ticketCode: 'ABC123' },
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('sendMultiChannel', () => {
    it('should send to multiple channels', async () => {
      const results = await service.sendMultiChannel(
        ['SMS', 'WHATSAPP'],
        '+51999999999',
        'Test message',
      );

      expect(results.sms).toBeDefined();
      expect(results.sms.success).toBe(true);
      expect(results.whatsapp).toBeDefined();
      expect(results.whatsapp.success).toBe(true);
    });
  });

  describe('helper methods', () => {
    it('should send payment reminder', async () => {
      const result = await service.sendPaymentReminder(
        '+51999999999',
        'https://example.com/pay/123',
      );

      expect(result.success).toBe(true);
    });

    it('should send event reminder', async () => {
      const result = await service.sendEventReminder(
        '+51999999999',
        'Test Event',
      );

      expect(result.success).toBe(true);
    });

    it('should send certificate ready notification', async () => {
      const result = await service.sendCertificateReady(
        '+51999999999',
        'https://example.com/cert/123',
      );

      expect(result.success).toBe(true);
    });

    it('should send payment confirmation via WhatsApp', async () => {
      const result = await service.sendPaymentConfirmationWhatsApp(
        '+51999999999',
        'Test Event',
        'ABC123',
      );

      expect(result.success).toBe(true);
    });

    it('should send ticket transfer notification', async () => {
      const result = await service.sendTicketTransferNotification(
        '+51999999999',
        'Test Event',
        'ABC123',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('delivery status', () => {
    it('should get SMS delivery status', async () => {
      const status = await service.getSmsDeliveryStatus('mock-message-id');

      expect(status).toBeDefined();
    });

    it('should get WhatsApp delivery status', async () => {
      const status = await service.getWhatsAppDeliveryStatus('mock-message-id');

      expect(status).toBeDefined();
    });
  });
});
