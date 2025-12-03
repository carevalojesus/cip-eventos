// Mock uuid before any imports
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificatesService } from './certificates.service';
import {
  Certificate,
  CertificateStatus,
  CertificateType,
} from './entities/certificate.entity';
import { Event } from '../events/entities/event.entity';
import {
  Registration,
  RegistrationStatus,
} from '../registrations/entities/registration.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { User } from '../users/entities/user.entity';
import { PdfService } from '../pdf/pdf.service';
import { QrService } from '../common/qr.service';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let certificateRepo: jest.Mocked<Repository<Certificate>>;
  let eventRepo: jest.Mocked<Repository<Event>>;
  let registrationRepo: jest.Mocked<Repository<Registration>>;
  let speakerRepo: jest.Mocked<Repository<Speaker>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let pdfService: jest.Mocked<PdfService>;
  let qrService: jest.Mocked<QrService>;

  const mockCertificateRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockEventRepository = {
    findOne: jest.fn(),
  };

  const mockRegistrationRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockSpeakerRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockPdfService = {
    generateCertificatePdf: jest.fn(),
  };

  const mockQrService = {
    generateQrBase64: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        {
          provide: getRepositoryToken(Certificate),
          useValue: mockCertificateRepository,
        },
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(Registration),
          useValue: mockRegistrationRepository,
        },
        {
          provide: getRepositoryToken(Speaker),
          useValue: mockSpeakerRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
        {
          provide: QrService,
          useValue: mockQrService,
        },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    certificateRepo = module.get(getRepositoryToken(Certificate));
    eventRepo = module.get(getRepositoryToken(Event));
    registrationRepo = module.get(getRepositoryToken(Registration));
    speakerRepo = module.get(getRepositoryToken(Speaker));
    userRepo = module.get(getRepositoryToken(User));
    pdfService = module.get(PdfService);
    qrService = module.get(QrService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('issueAttendanceCertificate', () => {
    const mockEvent = {
      id: 'event-123',
      title: 'Test Event',
      startAt: new Date('2025-01-15'),
      certificateHours: 8,
      signers: [
        {
          fullName: 'John Signer',
          title: 'Director',
          signatureUrl: 'https://example.com/signature.png',
        },
      ],
    } as Event;

    const mockRegistration = {
      id: 'reg-123',
      attended: true,
      status: RegistrationStatus.CONFIRMED,
      attendee: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      },
      event: mockEvent,
    } as Registration;

    it('should generate attendance certificate successfully', async () => {
      mockRegistrationRepository.findOne.mockResolvedValue(mockRegistration);
      mockQrService.generateQrBase64.mockResolvedValue('base64-qr-code');
      mockPdfService.generateCertificatePdf.mockResolvedValue(
        '/certificates/cert-123.pdf',
      );

      const mockCertificate = {
        id: 'cert-123',
        type: CertificateType.ATTENDANCE,
        validationCode: 'CIP-2025-ABC123',
        pdfUrl: '/certificates/cert-123.pdf',
      } as Certificate;

      mockCertificateRepository.create.mockReturnValue(mockCertificate);
      mockCertificateRepository.save.mockResolvedValue(mockCertificate);

      const result = await service.issueAttendanceCertificate('reg-123');

      expect(result).toHaveProperty('id', 'cert-123');
      expect(result).toHaveProperty('type', CertificateType.ATTENDANCE);
      expect(mockRegistrationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        relations: ['event', 'event.signers', 'attendee'],
      });
      expect(mockQrService.generateQrBase64).toHaveBeenCalled();
      expect(mockPdfService.generateCertificatePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientName: 'Jane Doe',
          eventTitle: 'Test Event',
          eventHours: 8,
        }),
      );
      expect(mockCertificateRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when registration not found', async () => {
      mockRegistrationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.issueAttendanceCertificate('invalid-reg'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const mockEvent = {
      id: 'event-123',
      title: 'Test Event',
      startAt: new Date('2025-01-15'),
      certificateHours: 8,
    } as Event;

    it('should create attendance certificate successfully', async () => {
      const createDto = {
        eventId: 'event-123',
        type: CertificateType.ATTENDANCE,
        registrationId: 'reg-123',
      };

      const mockRegistration = {
        id: 'reg-123',
        attendee: {
          firstName: 'John',
          lastName: 'Smith',
        },
        event: mockEvent,
      } as Registration;

      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockRegistrationRepository.findOne.mockResolvedValue(mockRegistration);
      mockCertificateRepository.findOne.mockResolvedValue(null); // no collision

      const mockCertificate = {
        id: 'cert-123',
        type: CertificateType.ATTENDANCE,
        status: CertificateStatus.ACTIVE,
      } as Certificate;

      mockCertificateRepository.create.mockReturnValue(mockCertificate);
      mockCertificateRepository.save.mockResolvedValue(mockCertificate);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id', 'cert-123');
      expect(result).toHaveProperty('type', CertificateType.ATTENDANCE);
      expect(mockRegistrationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        relations: ['attendee', 'event'],
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      const createDto = {
        eventId: 'invalid-event',
        type: CertificateType.ATTENDANCE,
        registrationId: 'reg-123',
      };

      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when registrationId is missing for ATTENDANCE', async () => {
      const createDto = {
        eventId: 'event-123',
        type: CertificateType.ATTENDANCE,
        // missing registrationId
      };

      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when registration not found', async () => {
      const createDto = {
        eventId: 'event-123',
        type: CertificateType.ATTENDANCE,
        registrationId: 'invalid-reg',
      };

      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockRegistrationRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when registration does not belong to event', async () => {
      const createDto = {
        eventId: 'event-123',
        type: CertificateType.ATTENDANCE,
        registrationId: 'reg-123',
      };

      const differentEvent = {
        id: 'different-event',
        title: 'Different Event',
      } as Event;

      const mockRegistration = {
        id: 'reg-123',
        event: differentEvent,
        attendee: {
          firstName: 'John',
          lastName: 'Doe',
        },
      } as Registration;

      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockRegistrationRepository.findOne.mockResolvedValue(mockRegistration);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create speaker certificate successfully', async () => {
      const createDto = {
        eventId: 'event-123',
        type: CertificateType.SPEAKER,
        speakerId: 'speaker-123',
      };

      const mockSpeaker = {
        id: 'speaker-123',
        firstName: 'Speaker',
        lastName: 'Name',
      } as Speaker;

      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockSpeakerRepository.findOne.mockResolvedValue(mockSpeaker);
      mockCertificateRepository.findOne.mockResolvedValue(null);

      const mockCertificate = {
        id: 'cert-123',
        type: CertificateType.SPEAKER,
      } as Certificate;

      mockCertificateRepository.create.mockReturnValue(mockCertificate);
      mockCertificateRepository.save.mockResolvedValue(mockCertificate);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('type', CertificateType.SPEAKER);
      expect(mockSpeakerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'speaker-123' },
      });
    });

    it('should throw BadRequestException when speakerId is missing for SPEAKER', async () => {
      const createDto = {
        eventId: 'event-123',
        type: CertificateType.SPEAKER,
      };

      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create organizer certificate successfully', async () => {
      const createDto = {
        eventId: 'event-123',
        type: CertificateType.ORGANIZER,
        userId: 'user-123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'organizer@example.com',
        profile: {
          firstName: 'Organizer',
          lastName: 'Name',
        },
      } as User;

      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockCertificateRepository.findOne.mockResolvedValue(null);

      const mockCertificate = {
        id: 'cert-123',
        type: CertificateType.ORGANIZER,
      } as Certificate;

      mockCertificateRepository.create.mockReturnValue(mockCertificate);
      mockCertificateRepository.save.mockResolvedValue(mockCertificate);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('type', CertificateType.ORGANIZER);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['profile'],
      });
    });
  });

  describe('findByValidationCode', () => {
    it('should find certificate by validation code', async () => {
      const mockCertificate = {
        id: 'cert-123',
        validationCode: 'CIP-2025-ABC123',
        status: CertificateStatus.ACTIVE,
      } as Certificate;

      mockCertificateRepository.findOne.mockResolvedValue(mockCertificate);

      const result = await service.findByValidationCode('CIP-2025-ABC123');

      expect(result).toEqual(mockCertificate);
      expect(mockCertificateRepository.findOne).toHaveBeenCalledWith({
        where: { validationCode: 'CIP-2025-ABC123' },
        relations: ['event'],
      });
    });

    it('should throw NotFoundException when certificate not found', async () => {
      mockCertificateRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByValidationCode('INVALID-CODE'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should find certificate by id', async () => {
      const mockCertificate = {
        id: 'cert-123',
        validationCode: 'CIP-2025-ABC123',
        status: CertificateStatus.ACTIVE,
      } as Certificate;

      mockCertificateRepository.findOne.mockResolvedValue(mockCertificate);

      const result = await service.findOne('cert-123');

      expect(result).toEqual(mockCertificate);
      expect(mockCertificateRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cert-123' },
        relations: ['event', 'registration', 'speaker', 'user'],
      });
    });

    it('should throw NotFoundException when certificate not found', async () => {
      mockCertificateRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update certificate successfully', async () => {
      const mockCertificate = {
        id: 'cert-123',
        status: CertificateStatus.ACTIVE,
      } as Certificate;

      const updateDto = {
        status: CertificateStatus.REVOKED,
      };

      mockCertificateRepository.findOne.mockResolvedValue(mockCertificate);
      mockCertificateRepository.save.mockResolvedValue({
        ...mockCertificate,
        ...updateDto,
      });

      const result = await service.update('cert-123', updateDto);

      expect(result.status).toBe(CertificateStatus.REVOKED);
      expect(mockCertificateRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove certificate successfully', async () => {
      const mockCertificate = {
        id: 'cert-123',
        validationCode: 'CIP-2025-ABC123',
      } as Certificate;

      mockCertificateRepository.findOne.mockResolvedValue(mockCertificate);
      mockCertificateRepository.remove.mockResolvedValue(mockCertificate);

      const result = await service.remove('cert-123');

      expect(result).toEqual(mockCertificate);
      expect(mockCertificateRepository.remove).toHaveBeenCalledWith(
        mockCertificate,
      );
    });

    it('should throw NotFoundException when certificate not found', async () => {
      mockCertificateRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('issueBatchCertificates', () => {
    it('should initiate batch certificate generation', () => {
      // Mock the private method to prevent actual execution
      jest
        .spyOn<any, any>(service, 'processBatchCertificates')
        .mockResolvedValue(undefined);

      const result = service.issueBatchCertificates('event-123');

      expect(result).toEqual({
        message: 'Proceso de emisión masiva iniciado en segundo plano.',
        eventId: 'event-123',
      });
    });
  });

  describe('findAll', () => {
    it('should return all certificates', async () => {
      const mockCertificates = [
        { id: 'cert-1', validationCode: 'CODE-1' },
        { id: 'cert-2', validationCode: 'CODE-2' },
      ] as Certificate[];

      mockCertificateRepository.find.mockResolvedValue(mockCertificates);

      const result = await service.findAll();

      expect(result).toEqual(mockCertificates);
      expect(mockCertificateRepository.find).toHaveBeenCalledWith({
        relations: ['event', 'registration', 'speaker', 'user'],
      });
    });
  });
});
