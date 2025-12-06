import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import {
  Certificate,
  CertificateStatus,
  CertificateType,
  CertificateVersionHistory,
} from './entities/certificate.entity';
import { Event } from '../events/entities/event.entity';
import {
  Registration,
  RegistrationStatus,
} from '../registrations/entities/registration.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { User } from '../users/entities/user.entity';
import {
  BlockEnrollment,
  BlockEnrollmentStatus,
} from '../evaluations/entities/block-enrollment.entity';
import { PdfService } from '../pdf/pdf.service';
import { v4 as uuidv4 } from 'uuid';
import { QrService } from '../common/qr.service';
import { CertificateValidationDto } from './dto/certificate-validation.dto';
import { BulkReissueResultDto } from './dto/bulk-reissue-result.dto';
import { NotificationTriggersService } from '../notifications/services/notification-triggers.service';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

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
    @InjectRepository(BlockEnrollment)
    private readonly blockEnrollmentRepository: Repository<BlockEnrollment>,
    private readonly pdfService: PdfService,
    private readonly qrService: QrService,
    private readonly notificationTriggers: NotificationTriggersService,
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
    const qrCode = await this.qrService.generateQrBase64(validationCode);
    const pdfRelativePath = await this.pdfService.generateCertificatePdf({
      recipientName: `${registration.attendee.firstName} ${registration.attendee.lastName}`,
      eventTitle: registration.event.title,
      // Formatear la fecha bonito (puedes usar date-fns o moment aquí)
      eventDate: registration.event.startAt.toLocaleDateString('es-PE'),
      eventHours: registration.event.certificateHours,
      validationCode: validationCode,
      qrCode: qrCode,
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

    const savedCert = await this.certificateRepository.save(cert);

    // Trigger notificación de certificado disponible
    await this.notificationTriggers.onCertificateIssued(savedCert);

    return savedCert;
  }

  // ========== CERTIFICADO DE APROBACIÓN (Bloques Evaluables) ==========

  async issueApprovalCertificate(enrollmentId: string) {
    // 1. Buscar inscripción con todas las relaciones necesarias
    const enrollment = await this.blockEnrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: [
        'block',
        'block.event',
        'block.event.signers',
        'block.instructors',
        'attendee',
      ],
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    // 2. Validar que esté aprobado
    if (enrollment.status !== BlockEnrollmentStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot issue approval certificate for non-approved enrollment',
      );
    }

    // 3. Verificar que no tenga certificado ya emitido
    const existingCert = await this.certificateRepository.findOne({
      where: { blockEnrollment: { id: enrollmentId } },
    });

    if (existingCert) {
      throw new BadRequestException(
        'Approval certificate already issued for this enrollment',
      );
    }

    const block = enrollment.block;
    const event = block.event;
    const attendee = enrollment.attendee;

    // 4. Generar código único
    const validationCode = `CIP-${new Date().getFullYear()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    // 5. Generar QR y PDF
    const qrCode = await this.qrService.generateQrBase64(validationCode);

    const pdfRelativePath = await this.pdfService.generateCertificatePdf({
      recipientName: `${attendee.firstName} ${attendee.lastName}`,
      eventTitle: `${block.name} - ${event.title}`,
      eventDate: block.endAt
        ? block.endAt.toLocaleDateString('es-PE')
        : event.endAt.toLocaleDateString('es-PE'),
      eventHours: block.hours,
      validationCode: validationCode,
      qrCode: qrCode,
      signers: event.signers.map((s) => ({
        fullName: s.fullName,
        title: s.title,
        signatureUrl: s.signatureUrl,
      })),
      // Metadata adicional para certificado de aprobación
      additionalInfo: {
        blockType: block.type,
        finalGrade: enrollment.finalGradeAfterRetake ?? enrollment.finalGrade,
        attendancePercentage: enrollment.attendancePercentage,
        instructors: block.instructors.map(
          (i) => `${i.firstName} ${i.lastName}`,
        ),
      },
    });

    // 6. Crear y guardar certificado
    const cert = this.certificateRepository.create({
      type: CertificateType.APPROVAL,
      event: event,
      blockEnrollment: enrollment,
      validationCode: validationCode,
      pdfUrl: pdfRelativePath,
      metadata: {
        eventName: event.title,
        blockName: block.name,
        blockType: block.type,
        eventDate: block.endAt?.toISOString() || event.endAt?.toISOString(),
        hours: block.hours,
        recipientName: `${attendee.firstName} ${attendee.lastName}`,
        finalGrade: Number(
          enrollment.finalGradeAfterRetake ?? enrollment.finalGrade,
        ),
        attendancePercentage: enrollment.attendancePercentage,
        instructors: block.instructors.map(
          (i) => `${i.firstName} ${i.lastName}`,
        ),
      },
    });

    const saved = await this.certificateRepository.save(cert);

    // 7. Actualizar enrollment con referencia al certificado
    enrollment.certificateId = saved.id;
    await this.blockEnrollmentRepository.save(enrollment);

    this.logger.log(
      `🎓 Certificado de aprobación emitido: ${attendee.firstName} ${attendee.lastName} - ${block.name}`,
    );

    return saved;
  }

  async issueBatchApprovalCertificates(blockId: string) {
    // Ejecutar en segundo plano
    this.processBatchApprovalCertificates(blockId).catch((err) => {
      this.logger.error(
        `Error en batch approval certificates para bloque ${blockId}`,
        err,
      );
    });

    return {
      message: 'Proceso de emisión masiva de certificados de aprobación iniciado.',
      blockId,
    };
  }

  private async processBatchApprovalCertificates(blockId: string) {
    this.logger.log(
      `🚀 Iniciando emisión masiva de certificados de aprobación para bloque: ${blockId}`,
    );

    // 1. Buscar inscripciones APROBADAS
    const enrollments = await this.blockEnrollmentRepository.find({
      where: {
        block: { id: blockId },
        status: BlockEnrollmentStatus.APPROVED,
      },
      relations: ['attendee'],
    });

    this.logger.log(
      `📋 Encontrados ${enrollments.length} participantes aprobados.`,
    );

    let successCount = 0;
    let errorCount = 0;

    for (const enrollment of enrollments) {
      try {
        // Verificar si ya tiene certificado
        const existing = await this.certificateRepository.findOne({
          where: { blockEnrollment: { id: enrollment.id } },
        });

        if (existing) {
          continue;
        }

        await this.issueApprovalCertificate(enrollment.id);
        successCount++;

        // Pequeña pausa
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(
          `❌ Error generando certificado para ${enrollment.attendee.email}:`,
          error,
        );
        errorCount++;
      }
    }

    this.logger.log(
      `🏁 Finalizado batch para bloque ${blockId}. Éxitos: ${successCount}, Errores: ${errorCount}`,
    );
  }

  issueBatchCertificates(eventId: string) {
    // Ejecutar en segundo plano (Fire and Forget)
    this.processBatchCertificates(eventId).catch((err) => {
      this.logger.error(
        `Error en batch certificates para evento ${eventId}`,
        err,
      );
    });

    return {
      message: 'Proceso de emisión masiva iniciado en segundo plano.',
      eventId,
    };
  }

  private async processBatchCertificates(eventId: string) {
    this.logger.log(`🚀 Iniciando emisión masiva para evento: ${eventId}`);

    // 1. Buscar inscripciones CONFIRMADAS y ASISTIDAS
    const registrations = await this.registrationRepository.find({
      where: {
        event: { id: eventId },
        status: RegistrationStatus.CONFIRMED,
        attended: true,
      },
      relations: ['event', 'event.signers', 'attendee'],
    });

    this.logger.log(`📋 Encontrados ${registrations.length} asistentes aptos.`);

    let successCount = 0;
    let errorCount = 0;

    for (const reg of registrations) {
      try {
        // Verificar si ya tiene certificado para no duplicar
        const existing = await this.certificateRepository.findOne({
          where: { registration: { id: reg.id } },
        });

        if (existing) {
          // console.log(`⏭️ El usuario ${reg.attendee.email} ya tiene certificado.`);
          continue;
        }

        // Reutilizamos la lógica de emisión individual
        // NOTA: issueAttendanceCertificate hace una query extra para buscar la registration,
        // podríamos optimizarlo pasando la entidad, pero por simplicidad y robustez lo llamamos así.
        await this.issueAttendanceCertificate(reg.id);
        successCount++;

        // Pequeña pausa para no saturar CPU/Memoria si son muchos
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(
          `❌ Error generando certificado para ${reg.attendee.email}:`,
          error,
        );
        errorCount++;
      }
    }

    this.logger.log(
      `🏁 Finalizado batch para evento ${eventId}. Éxitos: ${successCount}, Errores: ${errorCount}`,
    );
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

  /**
   * Reemite un certificado con datos actualizados
   * Incrementa versión, regenera PDF, mantiene mismo código
   */
  async reissue(
    certificateId: string,
    reason: string,
    performedBy: User,
  ): Promise<Certificate> {
    // 1. Obtener certificado actual con todas las relaciones
    const certificate = await this.certificateRepository.findOne({
      where: { id: certificateId },
      relations: [
        'event',
        'event.signers',
        'registration',
        'registration.attendee',
        'speaker',
        'user',
        'user.profile',
        'blockEnrollment',
        'blockEnrollment.attendee',
        'blockEnrollment.block',
        'blockEnrollment.block.instructors',
      ],
    });

    if (!certificate) {
      throw new NotFoundException(
        `Certificate with ID ${certificateId} not found`,
      );
    }

    // 2. Validar que no esté revocado
    if (certificate.status === CertificateStatus.REVOKED) {
      throw new BadRequestException(
        'Cannot reissue a revoked certificate. Please create a new one instead.',
      );
    }

    // 3. Guardar versión actual en historial
    const historyEntry: CertificateVersionHistory = {
      version: certificate.version,
      issuedAt: certificate.issuedAt,
      pdfUrl: certificate.pdfUrl,
      metadata: certificate.metadata || {},
      reason,
    };

    const versionHistory = certificate.versionHistory || [];
    versionHistory.push(historyEntry);

    // 4. Incrementar versión
    const newVersion = certificate.version + 1;

    // 5. Obtener datos actualizados según el tipo de certificado
    let recipientName = '';
    let eventTitle = '';
    let eventDate = '';
    let eventHours = 0;
    let additionalInfo: any = undefined;

    if (
      certificate.type === CertificateType.ATTENDANCE &&
      certificate.registration
    ) {
      const { firstName, lastName } = certificate.registration.attendee;
      recipientName = `${firstName} ${lastName}`.trim();
      eventTitle = certificate.event.title;
      eventDate = certificate.event.startAt.toLocaleDateString('es-PE');
      eventHours = certificate.event.certificateHours;
    } else if (certificate.type === CertificateType.SPEAKER && certificate.speaker) {
      recipientName = `${certificate.speaker.firstName} ${certificate.speaker.lastName}`.trim();
      eventTitle = certificate.event.title;
      eventDate = certificate.event.startAt.toLocaleDateString('es-PE');
      eventHours = certificate.event.certificateHours;
    } else if (
      certificate.type === CertificateType.ORGANIZER &&
      certificate.user
    ) {
      if (certificate.user.profile) {
        recipientName = `${certificate.user.profile.firstName} ${certificate.user.profile.lastName}`.trim();
      } else {
        recipientName = certificate.user.email;
      }
      eventTitle = certificate.event.title;
      eventDate = certificate.event.startAt.toLocaleDateString('es-PE');
      eventHours = certificate.event.certificateHours;
    } else if (
      certificate.type === CertificateType.APPROVAL &&
      certificate.blockEnrollment
    ) {
      const enrollment = certificate.blockEnrollment;
      const block = enrollment.block;
      const attendee = enrollment.attendee;

      recipientName = `${attendee.firstName} ${attendee.lastName}`.trim();
      eventTitle = `${block.name} - ${certificate.event.title}`;
      eventDate = block.endAt
        ? block.endAt.toLocaleDateString('es-PE')
        : certificate.event.endAt.toLocaleDateString('es-PE');
      eventHours = block.hours;

      additionalInfo = {
        blockType: block.type,
        finalGrade: enrollment.finalGradeAfterRetake ?? enrollment.finalGrade,
        attendancePercentage: enrollment.attendancePercentage,
        instructors: block.instructors.map(
          (i) => `${i.firstName} ${i.lastName}`,
        ),
      };
    }

    // 6. Regenerar PDF con nuevos datos
    const qrCode = await this.qrService.generateQrBase64(
      certificate.validationCode,
    );

    const pdfRelativePath = await this.pdfService.generateCertificatePdf({
      recipientName,
      eventTitle,
      eventDate,
      eventHours,
      validationCode: certificate.validationCode,
      qrCode,
      signers: certificate.event.signers.map((s) => ({
        fullName: s.fullName,
        title: s.title,
        signatureUrl: s.signatureUrl,
      })),
      additionalInfo,
      version: newVersion, // 👈 Pasamos la versión al PDF
    });

    // 7. Actualizar metadata con nuevos datos
    const updatedMetadata = {
      eventName: eventTitle,
      eventDate: eventDate,
      hours: eventHours,
      recipientName,
      version: newVersion,
      lastReissuedAt: new Date().toISOString(),
      reissueReason: reason,
    };

    // 8. Actualizar certificado
    certificate.version = newVersion;
    certificate.versionHistory = versionHistory;
    certificate.pdfUrl = pdfRelativePath;
    certificate.metadata = updatedMetadata;
    certificate.lastReissuedAt = new Date();
    certificate.lastReissuedBy = performedBy;

    const updated = await this.certificateRepository.save(certificate);

    this.logger.log(
      `✅ Certificado reemitido: ${certificate.validationCode} - Versión ${newVersion} - Motivo: ${reason}`,
    );

    return updated;
  }

  /**
   * Revoca un certificado
   */
  async revoke(
    certificateId: string,
    reason: string,
    performedBy: User,
  ): Promise<Certificate> {
    // 1. Obtener certificado
    const certificate = await this.findOne(certificateId);

    // 2. Validar que no esté ya revocado
    if (certificate.status === CertificateStatus.REVOKED) {
      throw new BadRequestException('Certificate is already revoked');
    }

    // 3. Cambiar status a REVOKED
    certificate.status = CertificateStatus.REVOKED;
    certificate.revokedAt = new Date();
    certificate.revokedReason = reason;
    certificate.revokedBy = performedBy;

    const revoked = await this.certificateRepository.save(certificate);

    this.logger.log(
      `🚫 Certificado revocado: ${certificate.validationCode} - Motivo: ${reason}`,
    );

    return revoked;
  }

  /**
   * Valida un certificado por código
   * Retorna info de validación incluyendo si está revocado
   */
  async validateByCode(code: string): Promise<CertificateValidationDto> {
    const certificate = await this.certificateRepository.findOne({
      where: { validationCode: code },
      relations: ['event'],
    });

    if (!certificate) {
      return {
        isValid: false,
        status: CertificateStatus.EXPIRED,
        message: 'Certificado no encontrado',
      };
    }

    // Verificar si está revocado
    if (certificate.status === CertificateStatus.REVOKED) {
      return {
        isValid: false,
        status: CertificateStatus.REVOKED,
        revocationInfo: {
          revokedAt: certificate.revokedAt,
          reason: certificate.revokedReason,
        },
        message: `Certificado revocado. Motivo: ${certificate.revokedReason}`,
      };
    }

    // Verificar si está expirado
    if (certificate.status === CertificateStatus.EXPIRED) {
      return {
        isValid: false,
        status: CertificateStatus.EXPIRED,
        message: 'Certificado expirado',
      };
    }

    // Certificado válido
    return {
      isValid: true,
      status: CertificateStatus.ACTIVE,
      certificate: {
        type: certificate.type,
        recipientName: certificate.metadata?.recipientName || '',
        eventName: certificate.metadata?.eventName || certificate.event?.title || '',
        eventDate: certificate.metadata?.eventDate || '',
        hours: certificate.metadata?.hours || 0,
        issuedAt: certificate.issuedAt,
        version: certificate.version,
      },
      message: 'Certificado válido',
    };
  }

  /**
   * Obtiene historial de versiones de un certificado
   */
  async getVersionHistory(
    certificateId: string,
  ): Promise<CertificateVersionHistory[]> {
    const certificate = await this.findOne(certificateId);

    // Incluir la versión actual en el historial
    const currentVersion: CertificateVersionHistory = {
      version: certificate.version,
      issuedAt: certificate.lastReissuedAt || certificate.issuedAt,
      pdfUrl: certificate.pdfUrl,
      metadata: certificate.metadata || {},
      reason: 'Versión actual',
    };

    const history = certificate.versionHistory || [];
    return [...history, currentVersion];
  }

  /**
   * Reemite múltiples certificados (ej: después de fusión de personas)
   */
  async bulkReissue(
    certificateIds: string[],
    reason: string,
    performedBy: User,
  ): Promise<BulkReissueResultDto> {
    this.logger.log(
      `🚀 Iniciando reemisión masiva de ${certificateIds.length} certificados`,
    );

    const results: Array<{
      certificateId: string;
      success: boolean;
      newVersion?: number;
      error?: string;
    }> = [];
    let successCount = 0;
    let errorCount = 0;

    for (const certId of certificateIds) {
      try {
        const updated = await this.reissue(certId, reason, performedBy);
        results.push({
          certificateId: certId,
          success: true,
          newVersion: updated.version,
        });
        successCount++;

        // Pequeña pausa para no saturar
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(
          `❌ Error reemitiendo certificado ${certId}:`,
          error.message,
        );
        results.push({
          certificateId: certId,
          success: false,
          error: error.message,
        });
        errorCount++;
      }
    }

    this.logger.log(
      `🏁 Reemisión masiva completada. Éxitos: ${successCount}, Errores: ${errorCount}`,
    );

    return {
      total: certificateIds.length,
      successful: successCount,
      failed: errorCount,
      results,
    };
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
