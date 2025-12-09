import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import {
  Registration,
  RegistrationStatus,
} from '../../registrations/entities/registration.entity';
import {
  Certificate,
  CertificateStatus,
} from '../../certificates/entities/certificate.entity';
import { Person } from '../../persons/entities/person.entity';
import { User } from '../../users/entities/user.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import {
  ProcessChargebackDto,
  ChargebackAction,
} from '../dto/process-chargeback.dto';

@Injectable()
export class ChargebackService {
  private readonly logger = new Logger(ChargebackService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly dataSource: DataSource,
  ) {}

  async processChargeback(
    dto: ProcessChargebackDto,
    processedBy: User,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: dto.paymentId },
      relations: ['registration', 'registration.attendee', 'registration.attendee.person'],
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    switch (dto.action) {
      case ChargebackAction.INITIATE:
        return this.initiateChargeback(payment, dto, processedBy);
      case ChargebackAction.CONFIRM:
        return this.confirmChargeback(payment, dto, processedBy);
      case ChargebackAction.REVERSE:
        return this.reverseChargeback(payment, dto, processedBy);
      default:
        throw new BadRequestException('Acción de contracargo no válida');
    }
  }

  private async initiateChargeback(
    payment: Payment,
    dto: ProcessChargebackDto,
    processedBy: User,
  ): Promise<Payment> {
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se puede iniciar contracargo en pagos completados',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const previousStatus = payment.status;

      // 1. Marcar pago en disputa (mantener COMPLETED pero registrar la disputa)
      payment.chargebackAt = new Date();
      payment.chargebackReason = dto.reason || 'Contracargo iniciado';
      payment.chargebackExternalId = dto.externalId || null;
      payment.chargebackProcessedBy = processedBy;

      await queryRunner.manager.save(payment);

      // 2. Marcar inscripción en disputa
      if (payment.registration) {
        const previousRegStatus = payment.registration.status;
        payment.registration.status = RegistrationStatus.IN_DISPUTE;
        await queryRunner.manager.save(payment.registration);

        // Audit log para registration
        await this.createAuditLog(
          queryRunner.manager,
          'Registration',
          payment.registration.id,
          AuditAction.UPDATE,
          { status: previousRegStatus },
          { status: RegistrationStatus.IN_DISPUTE },
          processedBy,
          `Inscripción en disputa por contracargo: ${dto.reason || 'Sin motivo especificado'}`,
        );
      }

      // Audit log para payment
      await this.createAuditLog(
        queryRunner.manager,
        'Payment',
        payment.id,
        AuditAction.UPDATE,
        { status: previousStatus, chargebackAt: null },
        { status: payment.status, chargebackAt: payment.chargebackAt },
        processedBy,
        `Contracargo iniciado: ${dto.reason || 'Sin motivo especificado'}`,
      );

      await queryRunner.commitTransaction();
      this.logger.log(`Contracargo iniciado para pago ${payment.id}`);
      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async confirmChargeback(
    payment: Payment,
    dto: ProcessChargebackDto,
    processedBy: User,
  ): Promise<Payment> {
    if (!payment.chargebackAt) {
      throw new BadRequestException(
        'El contracargo debe ser iniciado antes de confirmarlo',
      );
    }

    if (payment.status === PaymentStatus.CHARGEBACK) {
      throw new BadRequestException('El contracargo ya fue confirmado');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const previousStatus = payment.status;

      // 1. Marcar pago como CHARGEBACK
      payment.status = PaymentStatus.CHARGEBACK;
      payment.chargebackReason = dto.reason || payment.chargebackReason;
      await queryRunner.manager.save(payment);

      // 2. Cancelar inscripción por contracargo
      if (payment.registration) {
        payment.registration.status = RegistrationStatus.CANCELLED_BY_CHARGEBACK;
        await queryRunner.manager.save(payment.registration);

        // 3. Revocar certificados asociados
        await this.revokeCertificates(
          queryRunner.manager,
          payment.registration.id,
          processedBy,
          'Revocado por contracargo bancario',
        );

        // 4. Marcar persona con flag de riesgo
        if (payment.registration.attendee?.person) {
          const person = payment.registration.attendee.person;
          const previousFlagRisk = person.flagRisk;
          person.flagRisk = true;
          await queryRunner.manager.save(person);

          await this.createAuditLog(
            queryRunner.manager,
            'Person',
            person.id,
            AuditAction.UPDATE,
            { flagRisk: previousFlagRisk },
            { flagRisk: true },
            processedBy,
            `Marcado como riesgo por contracargo en pago ${payment.id}`,
          );
        }
      }

      // Audit log para payment
      await this.createAuditLog(
        queryRunner.manager,
        'Payment',
        payment.id,
        AuditAction.UPDATE,
        { status: previousStatus },
        { status: PaymentStatus.CHARGEBACK },
        processedBy,
        `Contracargo confirmado: ${dto.reason || 'Sin motivo especificado'}`,
      );

      await queryRunner.commitTransaction();
      this.logger.log(`Contracargo confirmado para pago ${payment.id}`);
      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async reverseChargeback(
    payment: Payment,
    dto: ProcessChargebackDto,
    processedBy: User,
  ): Promise<Payment> {
    if (!payment.chargebackAt) {
      throw new BadRequestException('No hay contracargo registrado para este pago');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const previousStatus = payment.status;

      // 1. Revertir el contracargo
      payment.status = PaymentStatus.CHARGEBACK_REVERSED;
      payment.chargebackReversedAt = new Date();
      await queryRunner.manager.save(payment);

      // 2. Si la inscripción estaba en disputa, restaurar a confirmado
      if (
        payment.registration &&
        payment.registration.status === RegistrationStatus.IN_DISPUTE
      ) {
        payment.registration.status = RegistrationStatus.CONFIRMED;
        await queryRunner.manager.save(payment.registration);
      }

      // Nota: No quitamos automáticamente el flagRisk de la persona
      // ya que puede haber otros contracargos o el admin puede querer revisarlo manualmente

      // Audit log
      await this.createAuditLog(
        queryRunner.manager,
        'Payment',
        payment.id,
        AuditAction.UPDATE,
        { status: previousStatus },
        { status: PaymentStatus.CHARGEBACK_REVERSED },
        processedBy,
        `Contracargo revertido (disputa ganada): ${dto.reason || 'Sin motivo especificado'}`,
      );

      await queryRunner.commitTransaction();
      this.logger.log(`Contracargo revertido para pago ${payment.id}`);
      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async revokeCertificates(
    manager: any,
    registrationId: string,
    revokedBy: User,
    reason: string,
  ): Promise<void> {
    const certificates = await this.certificateRepository.find({
      where: {
        registration: { id: registrationId },
        status: CertificateStatus.ACTIVE,
      },
    });

    for (const certificate of certificates) {
      const previousStatus = certificate.status;
      certificate.status = CertificateStatus.REVOKED;
      certificate.revokedAt = new Date();
      certificate.revokedReason = reason;
      certificate.revokedBy = revokedBy;
      await manager.save(certificate);

      await this.createAuditLog(
        manager,
        'Certificate',
        certificate.id,
        AuditAction.REVOKE,
        { status: previousStatus },
        { status: CertificateStatus.REVOKED, revokedReason: reason },
        revokedBy,
        reason,
      );

      this.logger.log(`Certificado ${certificate.id} revocado por contracargo`);
    }
  }

  private async createAuditLog(
    manager: any,
    entityType: string,
    entityId: string,
    action: AuditAction,
    previousValues: Record<string, any> | null,
    newValues: Record<string, any> | null,
    performedBy: User,
    reason?: string,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      entityType,
      entityId,
      action,
      previousValues,
      newValues,
      performedBy,
      performedByEmail: performedBy.email,
      reason,
    });
    await manager.save(auditLog);
  }

  async getChargebacksByStatus(status?: PaymentStatus): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.registration', 'registration')
      .leftJoinAndSelect('registration.attendee', 'attendee')
      .leftJoinAndSelect('registration.event', 'event')
      .where('payment.chargebackAt IS NOT NULL');

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    return queryBuilder.orderBy('payment.chargebackAt', 'DESC').getMany();
  }
}
