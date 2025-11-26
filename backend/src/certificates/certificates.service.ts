import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import {
  Certificate,
  CertificateStatus,
  CertificateType,
} from './entities/certificate.entity';
import { Event } from '../events/entities/event.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { User } from '../users/entities/user.entity';
import { PdfService } from '../pdf/pdf.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(Speaker)
    private readonly speakerRepository: Repository<Speaker>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly pdfService: PdfService,
  ) {}

  async issueAttendanceCertificate(registrationId: string) {
    // 1. Buscar datos completos (incluyendo firmantes del evento)
    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId },
      relations: ['event', 'event.signers', 'attendee'], // 👈 ¡Importante traer los signers!
    });

    if (!registration) {
      throw new NotFoundException(
        `Registration with ID ${registrationId} not found`,
      );
    }

    // ... (validaciones de siempre: si asistió, si el evento tiene certificado...)

    // Generar Código Único
    const validationCode = `CIP-${new Date().getFullYear()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    // 2. 🔥 GENERAR EL PDF 🔥
    const pdfRelativePath = await this.pdfService.generateCertificatePdf({
      recipientName: `${registration.attendee.firstName} ${registration.attendee.lastName}`,
      eventTitle: registration.event.title,
      // Formatear la fecha bonito (puedes usar date-fns o moment aquí)
      eventDate: registration.event.startAt.toLocaleDateString('es-PE'),
      eventHours: registration.event.certificateHours,
      validationCode: validationCode,
      // Mapeamos los firmantes al formato que espera la plantilla
      signers: registration.event.signers.map((s) => ({
        fullName: s.fullName,
        title: s.title,
        signatureUrl: s.signatureUrl,
      })),
    });

    // 3. Guardar registro en DB con la ruta del PDF
    const cert = this.certificateRepository.create({
      type: CertificateType.ATTENDANCE,
      event: registration.event,
      registration: registration,
      validationCode: validationCode,
      pdfUrl: pdfRelativePath, // 👈 Guardamos la ruta
    });

    return await this.certificateRepository.save(cert);
  }

  async create(createCertificateDto: CreateCertificateDto) {
    const { eventId, type, registrationId, speakerId, userId } =
      createCertificateDto;

    // 1. Validar Evento
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    let recipientName = '';
    let relatedEntity: Partial<Certificate> = {};

    // 2. Validar Relación según Tipo
    if (type === CertificateType.ATTENDANCE) {
      if (!registrationId)
        throw new BadRequestException(
          'registrationId is required for ATTENDANCE certificates',
        );

      const registration = await this.registrationRepository.findOne({
        where: { id: registrationId },
        relations: ['attendee', 'event'],
      });

      if (!registration)
        throw new NotFoundException(
          `Registration with ID ${registrationId} not found`,
        );

      // Validar que la inscripción corresponda al evento
      if (registration.event?.id !== eventId) {
        throw new BadRequestException(
          'Registration does not belong to this event',
        );
      }

      const { firstName, lastName } = registration.attendee;
      recipientName = `${firstName} ${lastName}`.trim();
      relatedEntity = { registration };
    } else if (type === CertificateType.SPEAKER) {
      if (!speakerId)
        throw new BadRequestException(
          'speakerId is required for SPEAKER certificates',
        );

      const speaker = await this.speakerRepository.findOne({
        where: { id: speakerId },
      });
      if (!speaker)
        throw new NotFoundException(`Speaker with ID ${speakerId} not found`);

      recipientName = `${speaker.firstName} ${speaker.lastName}`.trim();
      relatedEntity = { speaker };
    } else if (type === CertificateType.ORGANIZER) {
      if (!userId)
        throw new BadRequestException(
          'userId is required for ORGANIZER certificates',
        );

      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });
      if (!user)
        throw new NotFoundException(`User with ID ${userId} not found`);

      if (user.profile) {
        recipientName =
          `${user.profile.firstName} ${user.profile.lastName}`.trim();
      } else {
        recipientName = user.email; // Fallback
      }
      relatedEntity = { user };
    }

    // 3. Generar Código Único
    const validationCode = await this.generateValidationCode(event.title);

    // 4. Crear Snapshot de Metadata
    const metadata = {
      eventName: event.title,
      eventDate:
        event.startAt instanceof Date
          ? event.startAt.toISOString()
          : event.startAt,
      hours: Number(event.certificateHours || 0),
      recipientName,
      issuedAt: new Date().toISOString(),
    };

    // 5. Guardar
    const certificate = this.certificateRepository.create({
      type,
      status: CertificateStatus.ACTIVE,
      validationCode,
      metadata,
      event,
      ...relatedEntity,
    });

    return this.certificateRepository.save(certificate);
  }

  async findAll() {
    return this.certificateRepository.find({
      relations: ['event', 'registration', 'speaker', 'user'],
    });
  }

  async findOne(id: string) {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
      relations: ['event', 'registration', 'speaker', 'user'],
    });
    if (!certificate)
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    return certificate;
  }

  async findByValidationCode(code: string) {
    const certificate = await this.certificateRepository.findOne({
      where: { validationCode: code },
      relations: ['event'],
    });
    if (!certificate)
      throw new NotFoundException(`Certificate with code ${code} not found`);
    return certificate;
  }

  async update(id: string, updateCertificateDto: UpdateCertificateDto) {
    const certificate = await this.findOne(id);
    // Aquí podrías actualizar estado o pdfUrl
    Object.assign(certificate, updateCertificateDto);
    return this.certificateRepository.save(certificate);
  }

  async remove(id: string) {
    const certificate = await this.findOne(id);
    return this.certificateRepository.remove(certificate);
  }

  private async generateValidationCode(eventName: string): Promise<string> {
    // Lógica simple: CIP + AÑO + RANDOM
    // Mejorar según necesidad
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `CIP-${year}-${random}`;

    // Verificar colisión (poco probable pero posible)
    const existing = await this.certificateRepository.findOne({
      where: { validationCode: code },
    });
    if (existing) {
      return this.generateValidationCode(eventName);
    }
    return code;
  }
}
