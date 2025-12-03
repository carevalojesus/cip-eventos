// Mock uuid before any imports
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { PaymentsService } from './payments.service';
import {
  Payment,
  PaymentStatus,
  PaymentProvider,
} from './entities/payment.entity';
import {
  Registration,
  RegistrationStatus,
} from '../registrations/entities/registration.entity';
import { MailService } from '../mail/mail.service';
import { PaypalService } from './paypal.service';
import { User } from '../users/entities/user.entity';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: jest.Mocked<Repository<Payment>>;
  let registrationRepo: jest.Mocked<Repository<Registration>>;
  let mailService: jest.Mocked<MailService>;
  let paypalService: jest.Mocked<PaypalService>;
  let i18nService: jest.Mocked<I18nService>;

  const mockPaymentRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockRegistrationRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockMailService = {
    sendTicket: jest.fn(),
  };

  const mockPaypalService = {
    createOrder: jest.fn(),
    capturePayment: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(Registration),
          useValue: mockRegistrationRepository,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: PaypalService,
          useValue: mockPaypalService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepo = module.get(getRepositoryToken(Payment));
    registrationRepo = module.get(getRepositoryToken(Registration));
    mailService = module.get(MailService);
    paypalService = module.get(PaypalService);
    i18nService = module.get(I18nService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    } as User;

    const mockRegistration = {
      id: 'reg-123',
      finalPrice: 50,
      status: RegistrationStatus.PENDING,
      attendee: {
        user: mockUser,
      },
      event: {
        id: 'event-123',
        title: 'Test Event',
      },
    } as Registration;

    it('should create a simulated payment successfully', async () => {
      const createPaymentDto = {
        registrationId: 'reg-123',
        provider: PaymentProvider.SIMULATED,
      };

      mockRegistrationRepository.findOne.mockResolvedValue(mockRegistration);

      const mockPayment = {
        id: 'payment-123',
        amount: 50,
        currency: 'PEN',
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.SIMULATED,
        transactionId: 'TX-ABC123',
      } as Payment;

      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      const result = await service.createPaymentIntent(
        createPaymentDto,
        'user-123',
      );

      expect(result).toHaveProperty('paymentId', 'payment-123');
      expect(result).toHaveProperty('amount', 50);
      expect(result).toHaveProperty('checkoutUrl');
      expect(mockRegistrationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        relations: ['attendee', 'attendee.user', 'event'],
      });
      expect(mockPaymentRepository.save).toHaveBeenCalled();
    });

    it('should create a PayPal payment successfully', async () => {
      const createPaymentDto = {
        registrationId: 'reg-123',
        provider: PaymentProvider.PAYPAL,
      };

      mockRegistrationRepository.findOne.mockResolvedValue(mockRegistration);
      mockPaypalService.createOrder.mockResolvedValue('PAYPAL-ORDER-123');

      const mockPayment = {
        id: 'payment-123',
        amount: 50,
        currency: 'PEN',
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.PAYPAL,
        transactionId: 'PAYPAL-ORDER-123',
      } as Payment;

      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      const result = await service.createPaymentIntent(
        createPaymentDto,
        'user-123',
      );

      expect(result).toHaveProperty('paymentId', 'payment-123');
      expect(result).toHaveProperty('provider', 'PAYPAL');
      expect(result).toHaveProperty('paypalOrderId', 'PAYPAL-ORDER-123');
      expect(mockPaypalService.createOrder).toHaveBeenCalledWith(50, 'PEN');
    });

    it('should throw NotFoundException when registration not found', async () => {
      const createPaymentDto = {
        registrationId: 'invalid-reg',
        provider: PaymentProvider.SIMULATED,
      };

      mockRegistrationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent(createPaymentDto, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when registration is already confirmed', async () => {
      const createPaymentDto = {
        registrationId: 'reg-123',
        provider: PaymentProvider.SIMULATED,
      };

      const confirmedRegistration = {
        ...mockRegistration,
        status: RegistrationStatus.CONFIRMED,
      };

      mockRegistrationRepository.findOne.mockResolvedValue(
        confirmedRegistration,
      );

      await expect(
        service.createPaymentIntent(createPaymentDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when registration is cancelled', async () => {
      const createPaymentDto = {
        registrationId: 'reg-123',
        provider: PaymentProvider.SIMULATED,
      };

      const cancelledRegistration = {
        ...mockRegistration,
        status: RegistrationStatus.CANCELLED,
      };

      mockRegistrationRepository.findOne.mockResolvedValue(
        cancelledRegistration,
      );

      await expect(
        service.createPaymentIntent(createPaymentDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user is not the owner', async () => {
      const createPaymentDto = {
        registrationId: 'reg-123',
        provider: PaymentProvider.SIMULATED,
      };

      mockRegistrationRepository.findOne.mockResolvedValue(mockRegistration);

      await expect(
        service.createPaymentIntent(createPaymentDto, 'different-user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reviewPayment (approve)', () => {
    const mockAdminUser = {
      id: 'admin-123',
      email: 'admin@example.com',
    } as User;

    const mockPayment = {
      id: 'payment-123',
      status: PaymentStatus.WAITING_APPROVAL,
      registration: {
        id: 'reg-123',
        status: RegistrationStatus.PENDING,
        attendee: {
          email: 'attendee@example.com',
        },
        event: {
          title: 'Test Event',
        },
      },
    } as Payment;

    it('should approve payment successfully', async () => {
      const reviewDto = {
        isApproved: true,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
        reviewedBy: mockAdminUser,
      });
      mockRegistrationRepository.save.mockResolvedValue({
        ...mockPayment.registration,
        status: RegistrationStatus.CONFIRMED,
      });
      mockMailService.sendTicket.mockResolvedValue(undefined);

      const result = await service.reviewPayment(
        'payment-123',
        reviewDto,
        mockAdminUser,
      );

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      expect(mockRegistrationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: RegistrationStatus.CONFIRMED,
        }),
      );
      expect(mockMailService.sendTicket).toHaveBeenCalledWith(
        mockPayment.registration,
      );
    });

    it('should throw NotFoundException when payment not found', async () => {
      const reviewDto = {
        isApproved: true,
      };

      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.reviewPayment('invalid-payment', reviewDto, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when payment is already completed', async () => {
      const reviewDto = {
        isApproved: true,
      };

      const completedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      };

      mockPaymentRepository.findOne.mockResolvedValue(completedPayment);

      await expect(
        service.reviewPayment('payment-123', reviewDto, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reviewPayment (reject)', () => {
    const mockAdminUser = {
      id: 'admin-123',
      email: 'admin@example.com',
    } as User;

    const mockPayment = {
      id: 'payment-123',
      status: PaymentStatus.WAITING_APPROVAL,
      registration: {
        id: 'reg-123',
        status: RegistrationStatus.PENDING,
        attendee: {
          email: 'attendee@example.com',
        },
      },
    } as Payment;

    it('should reject payment successfully', async () => {
      const reviewDto = {
        isApproved: false,
        rejectionReason: 'Invalid evidence',
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.REJECTED,
        rejectionReason: 'Invalid evidence',
        reviewedBy: mockAdminUser,
      });

      const result = await service.reviewPayment(
        'payment-123',
        reviewDto,
        mockAdminUser,
      );

      expect(result.status).toBe(PaymentStatus.REJECTED);
      expect(result.rejectionReason).toBe('Invalid evidence');
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      expect(mockMailService.sendTicket).not.toHaveBeenCalled();
    });

    it('should reject payment with default reason when none provided', async () => {
      const reviewDto = {
        isApproved: false,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.REJECTED,
        rejectionReason: 'Datos inconsistentes',
        reviewedBy: mockAdminUser,
      });

      const result = await service.reviewPayment(
        'payment-123',
        reviewDto,
        mockAdminUser,
      );

      expect(result.status).toBe(PaymentStatus.REJECTED);
      expect(result.rejectionReason).toBe('Datos inconsistentes');
    });
  });

  describe('reportPayment', () => {
    const mockPayment = {
      id: 'payment-123',
      status: PaymentStatus.PENDING,
      registration: {
        id: 'reg-123',
        attendee: {
          email: 'attendee@example.com',
          user: {
            id: 'user-123',
          },
        },
      },
    } as Payment;

    it('should report payment successfully', async () => {
      const reportDto = {
        provider: PaymentProvider.YAPE,
        operationCode: 'OPE123456',
        evidenceUrl: 'https://example.com/evidence.jpg',
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.WAITING_APPROVAL,
        provider: PaymentProvider.YAPE,
        operationCode: 'OPE123456',
        evidenceUrl: 'https://example.com/evidence.jpg',
      });

      const result = await service.reportPayment(
        'payment-123',
        reportDto,
        'user-123',
      );

      expect(result.status).toBe(PaymentStatus.WAITING_APPROVAL);
      expect(result.provider).toBe(PaymentProvider.YAPE);
      expect(result.operationCode).toBe('OPE123456');
      expect(mockPaymentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      const reportDto = {
        provider: PaymentProvider.YAPE,
        operationCode: 'OPE123456',
      };

      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.reportPayment('invalid-payment', reportDto, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not the owner', async () => {
      const reportDto = {
        provider: PaymentProvider.YAPE,
        operationCode: 'OPE123456',
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      await expect(
        service.reportPayment('payment-123', reportDto, 'different-user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment is already completed', async () => {
      const reportDto = {
        provider: PaymentProvider.YAPE,
        operationCode: 'OPE123456',
      };

      const completedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      };

      mockPaymentRepository.findOne.mockResolvedValue(completedPayment);

      await expect(
        service.reportPayment('payment-123', reportDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completePaypalPayment', () => {
    const mockPayment = {
      id: 'payment-123',
      status: PaymentStatus.PENDING,
      transactionId: 'PAYPAL-ORDER-123',
      registration: {
        id: 'reg-123',
        status: RegistrationStatus.PENDING,
        attendee: {
          email: 'attendee@example.com',
          user: {
            id: 'user-123',
          },
        },
        event: {
          title: 'Test Event',
        },
      },
    } as Payment;

    it('should complete PayPal payment successfully', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaypalService.capturePayment.mockResolvedValue({
        success: true,
        metadata: { captureId: 'CAPTURE-123' },
      });
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });
      mockRegistrationRepository.save.mockResolvedValue({
        ...mockPayment.registration,
        status: RegistrationStatus.CONFIRMED,
      });
      mockMailService.sendTicket.mockResolvedValue(undefined);

      const result = await service.completePaypalPayment(
        'payment-123',
        'PAYPAL-ORDER-123',
        'user-123',
      );

      expect(result).toHaveProperty('message');
      expect(mockPaypalService.capturePayment).toHaveBeenCalledWith(
        'PAYPAL-ORDER-123',
      );
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      expect(mockMailService.sendTicket).toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completePaypalPayment(
          'invalid-payment',
          'PAYPAL-ORDER-123',
          'user-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return success when payment is already completed', async () => {
      const completedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      };

      mockPaymentRepository.findOne.mockResolvedValue(completedPayment);

      const result = await service.completePaypalPayment(
        'payment-123',
        'PAYPAL-ORDER-123',
        'user-123',
      );

      expect(result).toHaveProperty('message');
      expect(mockPaypalService.capturePayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user is not the owner', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
      };
      mockPaymentRepository.findOne.mockResolvedValue(pendingPayment);

      await expect(
        service.completePaypalPayment(
          'payment-123',
          'PAYPAL-ORDER-123',
          'different-user',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when order ID mismatch', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
      };
      mockPaymentRepository.findOne.mockResolvedValue(pendingPayment);

      await expect(
        service.completePaypalPayment(
          'payment-123',
          'DIFFERENT-ORDER-ID',
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when PayPal capture fails', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
      };
      mockPaymentRepository.findOne.mockResolvedValue(pendingPayment);
      mockPaypalService.capturePayment.mockResolvedValue({
        success: false,
      });

      await expect(
        service.completePaypalPayment(
          'payment-123',
          'PAYPAL-ORDER-123',
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
