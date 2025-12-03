// Mock uuid before any imports
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { RegistrationsService } from './registrations.service';
import {
  Registration,
  RegistrationStatus,
} from './entities/registration.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Attendee, DocumentType } from '../attendees/entities/attendee.entity';
import { User } from '../users/entities/user.entity';
import { EventStatus, Event } from '../events/entities/event.entity';
import { MailService } from '../mail/mail.service';
import { CipIntegrationService } from '../cip-integration/cip-integration.service';
import { EmailQueueService } from '../queue/services/email-queue.service';

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let regRepo: jest.Mocked<Repository<Registration>>;
  let ticketRepo: jest.Mocked<Repository<EventTicket>>;
  let attendeeRepo: jest.Mocked<Repository<Attendee>>;
  let mailService: jest.Mocked<MailService>;
  let cipService: jest.Mocked<CipIntegrationService>;
  let dataSource: jest.Mocked<DataSource>;
  let i18nService: jest.Mocked<I18nService>;
  let emailQueueService: jest.Mocked<EmailQueueService>;

  const mockRegistrationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockTicketRepository = {
    findOne: jest.fn(),
  };

  const mockAttendeeRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMailService = {
    sendTicket: jest.fn(),
  };

  const mockCipService = {
    validateCip: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn((key: string) => key),
  };

  const mockEmailQueueService = {
    addPaymentInstructions: jest.fn(),
    addWelcomeEmail: jest.fn(),
    queueTicketEmail: jest.fn(),
  };

  // Mock transaction manager
  const mockManager = {
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((isolationLevel, callback) => {
      return callback(mockManager);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        {
          provide: getRepositoryToken(Registration),
          useValue: mockRegistrationRepository,
        },
        {
          provide: getRepositoryToken(EventTicket),
          useValue: mockTicketRepository,
        },
        {
          provide: getRepositoryToken(Attendee),
          useValue: mockAttendeeRepository,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: CipIntegrationService,
          useValue: mockCipService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
        {
          provide: EmailQueueService,
          useValue: mockEmailQueueService,
        },
      ],
    }).compile();

    service = module.get<RegistrationsService>(RegistrationsService);
    regRepo = module.get(getRepositoryToken(Registration));
    ticketRepo = module.get(getRepositoryToken(EventTicket));
    attendeeRepo = module.get(getRepositoryToken(Attendee));
    mailService = module.get(MailService);
    cipService = module.get(CipIntegrationService);
    dataSource = module.get(DataSource);
    i18nService = module.get(I18nService);
    emailQueueService = module.get(EmailQueueService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
    } as User;

    const mockEvent = {
      id: 'event-123',
      title: 'Test Event',
      status: EventStatus.PUBLISHED,
    } as Event;

    const mockTicket = {
      id: 'ticket-123',
      price: 50,
      stock: 10,
      isActive: true,
      requiresCipValidation: false,
      event: mockEvent,
    } as EventTicket;

    const mockAttendee = {
      id: 'attendee-123',
      email: 'attendee@example.com',
      firstName: 'John',
      lastName: 'Doe',
      documentType: DocumentType.DNI,
      documentNumber: '12345678',
      user: mockUser,
    } as Attendee;

    it('should create registration successfully for logged-in user', async () => {
      const createDto = {
        ticketId: 'ticket-123',
      };

      mockManager.findOne
        .mockResolvedValueOnce(mockTicket) // ticket lookup
        .mockResolvedValueOnce(mockAttendee) // attendee lookup
        .mockResolvedValueOnce(null); // duplicate check

      mockManager.count.mockResolvedValue(0); // stock check

      const mockRegistration = {
        id: 'reg-123',
        ticketCode: 'test-uuid',
        finalPrice: 50,
        status: RegistrationStatus.PENDING,
      } as Registration;

      mockManager.create.mockReturnValue(mockRegistration);
      mockManager.save.mockResolvedValue(mockRegistration);

      const result = await service.create(createDto, mockUser);

      expect(result).toHaveProperty('registrationId', 'reg-123');
      expect(result).toHaveProperty('status', RegistrationStatus.PENDING);
      expect(result).toHaveProperty('price', 50);
      expect(mockManager.findOne).toHaveBeenCalledWith(
        EventTicket,
        expect.objectContaining({
          where: { id: 'ticket-123', isActive: true },
        }),
      );
    });

    it('should create confirmed registration for free ticket', async () => {
      const createDto = {
        ticketId: 'ticket-123',
      };

      const freeTicket = {
        ...mockTicket,
        price: 0,
      };

      mockManager.findOne
        .mockResolvedValueOnce(freeTicket)
        .mockResolvedValueOnce(mockAttendee)
        .mockResolvedValueOnce(null);

      mockManager.count.mockResolvedValue(0);

      const mockRegistration = {
        id: 'reg-123',
        ticketCode: 'test-uuid',
        finalPrice: 0,
        status: RegistrationStatus.CONFIRMED,
      } as Registration;

      mockManager.create.mockReturnValue(mockRegistration);
      mockManager.save.mockResolvedValue(mockRegistration);

      const result = await service.create(createDto, mockUser);

      expect(result).toHaveProperty('status', RegistrationStatus.CONFIRMED);
      expect(result).toHaveProperty('price', 0);
    });

    it('should throw NotFoundException when ticket not found', async () => {
      const createDto = {
        ticketId: 'invalid-ticket',
      };

      mockManager.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when event is not published', async () => {
      const createDto = {
        ticketId: 'ticket-123',
      };

      const unpublishedTicket = {
        ...mockTicket,
        event: {
          ...mockEvent,
          status: EventStatus.DRAFT,
        },
      };

      mockManager.findOne.mockResolvedValue(unpublishedTicket);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      const createDto = {
        ticketId: 'ticket-123',
      };

      mockManager.findOne.mockResolvedValue(mockTicket);
      mockManager.count.mockResolvedValue(10); // stock is 10, reserved is 10

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user is already registered', async () => {
      const createDto = {
        ticketId: 'ticket-123',
      };

      const existingRegistration = {
        id: 'existing-reg',
      } as Registration;

      mockManager.findOne
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(mockAttendee)
        .mockResolvedValueOnce(existingRegistration); // duplicate found

      mockManager.count.mockResolvedValue(0);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create registration for guest with complete data', async () => {
      const createDto = {
        ticketId: 'ticket-123',
        email: 'guest@example.com',
        firstName: 'Guest',
        lastName: 'User',
        documentType: DocumentType.DNI,
        documentNumber: '87654321',
      };

      mockManager.findOne
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(null) // no existing attendee
        .mockResolvedValueOnce(null); // no duplicate registration

      mockManager.count.mockResolvedValue(0);

      const newAttendee = {
        id: 'new-attendee-123',
        ...createDto,
      } as Attendee;

      const mockRegistration = {
        id: 'reg-123',
        finalPrice: 50,
        status: RegistrationStatus.PENDING,
      } as Registration;

      mockManager.create
        .mockReturnValueOnce(newAttendee)
        .mockReturnValueOnce(mockRegistration);

      mockManager.save
        .mockResolvedValueOnce(newAttendee)
        .mockResolvedValueOnce(mockRegistration);

      const result = await service.create(createDto, null);

      expect(result).toHaveProperty('registrationId', 'reg-123');
      expect(mockManager.save).toHaveBeenCalledTimes(2); // attendee + registration
    });

    it('should throw BadRequestException when guest data is incomplete', async () => {
      const createDto = {
        ticketId: 'ticket-123',
        // missing email, firstName, documentNumber
      };

      mockManager.findOne.mockResolvedValue(mockTicket);
      mockManager.count.mockResolvedValue(0);

      await expect(service.create(createDto, null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate CIP when ticket requires it', async () => {
      const createDto = {
        ticketId: 'ticket-123',
      };

      const cipTicket = {
        ...mockTicket,
        requiresCipValidation: true,
      };

      const attendeeWithCip = {
        ...mockAttendee,
        cipCode: 'CIP-12345',
      };

      mockManager.findOne
        .mockResolvedValueOnce(cipTicket)
        .mockResolvedValueOnce(attendeeWithCip)
        .mockResolvedValueOnce(null);

      mockManager.count.mockResolvedValue(0);

      mockCipService.validateCip.mockResolvedValue({
        isValid: true,
        isHabilitado: true,
      });

      const mockRegistration = {
        id: 'reg-123',
        finalPrice: 50,
        status: RegistrationStatus.PENDING,
      } as Registration;

      mockManager.create.mockReturnValue(mockRegistration);
      mockManager.save.mockResolvedValue(mockRegistration);

      const result = await service.create(createDto, mockUser);

      expect(mockCipService.validateCip).toHaveBeenCalledWith('CIP-12345');
      expect(result).toHaveProperty('registrationId');
    });

    it('should throw BadRequestException when CIP is required but not provided', async () => {
      const createDto = {
        ticketId: 'ticket-123',
      };

      const cipTicket = {
        ...mockTicket,
        requiresCipValidation: true,
      };

      const attendeeWithoutCip = {
        ...mockAttendee,
        cipCode: null,
      };

      mockManager.findOne
        .mockResolvedValueOnce(cipTicket)
        .mockResolvedValueOnce(attendeeWithoutCip)
        .mockResolvedValueOnce(null);

      mockManager.count.mockResolvedValue(0);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when CIP is not habilitated', async () => {
      const createDto = {
        ticketId: 'ticket-123',
      };

      const cipTicket = {
        ...mockTicket,
        requiresCipValidation: true,
      };

      const attendeeWithCip = {
        ...mockAttendee,
        cipCode: 'CIP-12345',
      };

      mockManager.findOne
        .mockResolvedValueOnce(cipTicket)
        .mockResolvedValueOnce(attendeeWithCip)
        .mockResolvedValueOnce(null);

      mockManager.count.mockResolvedValue(0);

      mockCipService.validateCip.mockResolvedValue({
        isValid: true,
        isHabilitado: false,
      });

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return registration when found', async () => {
      const mockRegistration = {
        id: 'reg-123',
        status: RegistrationStatus.CONFIRMED,
      } as Registration;

      mockRegistrationRepository.findOne.mockResolvedValue(mockRegistration);

      const result = await service.findOne('reg-123');

      expect(result).toEqual(mockRegistration);
      expect(mockRegistrationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        relations: ['attendee', 'event', 'eventTicket'],
      });
    });

    it('should throw NotFoundException when registration not found', async () => {
      mockRegistrationRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-reg')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkIn', () => {
    const mockRegistration = {
      id: 'reg-123',
      ticketCode: 'ticket-code-123',
      attended: false,
      attendee: {
        firstName: 'John',
        lastName: 'Doe',
      },
      event: {
        title: 'Test Event',
      },
    } as Registration;

    it('should check in attendee successfully', async () => {
      mockRegistrationRepository.findOne.mockResolvedValue(mockRegistration);
      mockRegistrationRepository.save.mockResolvedValue({
        ...mockRegistration,
        attended: true,
        attendedAt: new Date(),
      });

      const result = await service.checkIn('ticket-code-123');

      expect(result).toHaveProperty('attendee', 'John Doe');
      expect(result).toHaveProperty('event', 'Test Event');
      expect(mockRegistrationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          attended: true,
        }),
      );
    });

    it('should throw NotFoundException when ticket code not found', async () => {
      mockRegistrationRepository.findOne.mockResolvedValue(null);

      await expect(service.checkIn('invalid-code')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when already checked in', async () => {
      const attendedRegistration = {
        ...mockRegistration,
        attended: true,
        attendedAt: new Date(),
      };

      mockRegistrationRepository.findOne.mockResolvedValue(
        attendedRegistration,
      );

      await expect(service.checkIn('ticket-code-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getEventStats', () => {
    it('should return event statistics', async () => {
      const mockRegistrations = [
        { finalPrice: 50, attended: true } as Registration,
        { finalPrice: 30, attended: false } as Registration,
        { finalPrice: 50, attended: true } as Registration,
      ];

      mockRegistrationRepository.find.mockResolvedValue(mockRegistrations);

      const result = await service.getEventStats('event-123');

      expect(result).toEqual({
        totalRegistered: 3,
        totalRevenue: 130,
        checkedInCount: 2,
        attendancePercentage: '66.67%',
      });
    });

    it('should handle zero registrations', async () => {
      mockRegistrationRepository.find.mockResolvedValue([]);

      const result = await service.getEventStats('event-123');

      expect(result).toEqual({
        totalRegistered: 0,
        totalRevenue: 0,
        checkedInCount: 0,
        attendancePercentage: '0%',
      });
    });
  });
});
