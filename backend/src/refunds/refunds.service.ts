import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';

import {
  Refund,
  RefundStatus,
  RefundReason,
  RefundMethod,
} from './entities/refund.entity';
import { RefundPolicy } from './entities/refund-policy.entity';
import { CreateRefundDto } from './dto/create-refund.dto';
import { ReviewRefundDto } from './dto/review-refund.dto';

import {
  Registration,
  RegistrationStatus,
} from '../registrations/entities/registration.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { FiscalDocumentsService } from '../fiscal-documents/fiscal-documents.service';
import { CreditNoteReason } from '../fiscal-documents/entities/credit-note.entity';
import { NotificationTriggersService } from '../notifications/services/notification-triggers.service';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  // Política por defecto si no hay configuración específica
  private readonly defaultPolicies = [
    { daysBeforeEvent: 30, refundPercentage: 80 }, // Más de 30 días: 80%
    { daysBeforeEvent: 7, refundPercentage: 50 }, // Entre 7 y 30 días: 50%
    { daysBeforeEvent: 0, refundPercentage: 0 }, // Menos de 7 días: 0%
  ];

  constructor(
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    @InjectRepository(RefundPolicy)
    private readonly policyRepo: Repository<RefundPolicy>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly fiscalService: FiscalDocumentsService,
    private readonly i18n: I18nService,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {}

  // ========== SOLICITAR REEMBOLSO ==========

  async requestRefund(dto: CreateRefundDto, user: User): Promise<Refund> {
    // Buscar registro con sus relaciones
    const registration = await this.registrationRepo.findOne({
      where: { id: dto.registrationId },
      relations: ['payment', 'event', 'attendee', 'attendee.user'],
    });

    if (!registration) {
      throw new NotFoundException(
        this.i18n.t('refunds.registration_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar que el usuario sea el dueño del registro
    if (registration.attendee?.user?.id !== user.id) {
      throw new BadRequestException(
        this.i18n.t('refunds.not_owner', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar que el registro esté confirmado
    if (registration.status !== RegistrationStatus.CONFIRMED) {
      throw new BadRequestException(
        this.i18n.t('refunds.registration_not_confirmed', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar que haya un pago completado
    const payment = registration.payment;
    if (!payment || payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        this.i18n.t('refunds.no_completed_payment', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Verificar que no exista ya una solicitud de reembolso pendiente
    const existingRefund = await this.refundRepo.findOne({
      where: {
        registration: { id: dto.registrationId },
        status: In([
          RefundStatus.REQUESTED,
          RefundStatus.PENDING_REVIEW,
          RefundStatus.APPROVED,
          RefundStatus.PROCESSING,
        ]),
      },
    });

    if (existingRefund) {
      throw new BadRequestException(
        this.i18n.t('refunds.already_requested', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar que el evento no haya pasado
    if (registration.event.endAt < new Date()) {
      throw new BadRequestException(
        this.i18n.t('refunds.event_already_ended', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar que no haya asistido
    if (registration.attended) {
      throw new BadRequestException(
        this.i18n.t('refunds.already_attended', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Calcular porcentaje de reembolso según política
    const refundPercentage = await this.calculateRefundPercentage(
      registration.event.id,
      registration.event.startAt,
    );

    const originalAmount = Number(payment.amount);
    const refundAmount = Number(
      ((originalAmount * refundPercentage) / 100).toFixed(2),
    );

    // Crear solicitud de reembolso
    const refund = this.refundRepo.create({
      status: refundPercentage > 0 ? RefundStatus.REQUESTED : RefundStatus.REJECTED,
      reason: dto.reason,
      reasonDetails: dto.reasonDetails,
      originalAmount,
      refundAmount,
      refundPercentage,
      currency: payment.currency,
      refundMethod: dto.refundMethod || RefundMethod.SAME_METHOD,
      bankDetails: dto.bankDetails || null,
      payment,
      registration,
      requestedBy: user,
      requestedAt: new Date(),
      rejectionReason: refundPercentage === 0
        ? 'Solicitud fuera del plazo de reembolso'
        : null,
    });

    const savedRefund = await this.refundRepo.save(refund);

    this.logger.log(
      `💰 Solicitud de reembolso creada: ${savedRefund.id} - ${refundPercentage}% (S/ ${refundAmount})`,
    );

    return savedRefund;
  }

  // ========== CALCULAR PORCENTAJE ==========

  private async calculateRefundPercentage(
    eventId: string,
    eventStartAt: Date,
  ): Promise<number> {
    // Buscar políticas del evento
    let policies = await this.policyRepo.find({
      where: { event: { id: eventId }, isActive: true },
      order: { daysBeforeEvent: 'DESC' },
    });

    // Si no hay políticas específicas, buscar globales
    if (policies.length === 0) {
      policies = await this.policyRepo.find({
        where: { event: null as any, isActive: true },
        order: { daysBeforeEvent: 'DESC' },
      });
    }

    // Si tampoco hay globales, usar las por defecto
    const effectivePolicies =
      policies.length > 0
        ? policies.map((p) => ({
            daysBeforeEvent: p.daysBeforeEvent,
            refundPercentage: p.refundPercentage,
          }))
        : this.defaultPolicies;

    // Calcular días hasta el evento
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUntilEvent = Math.floor(
      (eventStartAt.getTime() - now.getTime()) / msPerDay,
    );

    // Encontrar la política aplicable
    for (const policy of effectivePolicies) {
      if (daysUntilEvent >= policy.daysBeforeEvent) {
        return policy.refundPercentage;
      }
    }

    return 0; // Sin derecho a reembolso
  }

  // ========== REVISAR REEMBOLSO (Admin) ==========

  async reviewRefund(
    refundId: string,
    dto: ReviewRefundDto,
    admin: User,
  ): Promise<Refund> {
    const refund = await this.findOne(refundId);

    if (refund.status !== RefundStatus.REQUESTED) {
      throw new BadRequestException(
        this.i18n.t('refunds.not_pending_review', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    refund.reviewedBy = admin;
    refund.reviewedAt = new Date();
    refund.reviewNotes = dto.reviewNotes || null;

    if (dto.isApproved) {
      // Ajustar porcentaje si el admin lo especifica
      if (dto.customRefundPercentage !== undefined) {
        refund.refundPercentage = dto.customRefundPercentage;
        refund.refundAmount = Number(
          ((refund.originalAmount * dto.customRefundPercentage) / 100).toFixed(2),
        );
      }

      refund.status = RefundStatus.APPROVED;
      this.logger.log(`✅ Reembolso ${refundId} aprobado por ${admin.email}`);
    } else {
      refund.status = RefundStatus.REJECTED;
      refund.rejectionReason = dto.rejectionReason || 'Solicitud rechazada';
      this.logger.log(`❌ Reembolso ${refundId} rechazado por ${admin.email}`);
    }

    return this.refundRepo.save(refund);
  }

  // ========== PROCESAR REEMBOLSO ==========

  async processRefund(refundId: string, admin: User): Promise<Refund> {
    const refund = await this.refundRepo.findOne({
      where: { id: refundId },
      relations: ['payment', 'registration', 'registration.event'],
    });

    if (!refund) {
      throw new NotFoundException(
        this.i18n.t('refunds.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (refund.status !== RefundStatus.APPROVED) {
      throw new BadRequestException(
        this.i18n.t('refunds.not_approved', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    refund.status = RefundStatus.PROCESSING;
    refund.processedBy = admin;
    refund.processedAt = new Date();
    await this.refundRepo.save(refund);

    // Actualizar estado del pago
    const payment = refund.payment;
    if (refund.refundPercentage === 100) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      // Reembolso parcial - mantener como COMPLETED pero con metadata
      payment.metadata = {
        ...payment.metadata,
        partialRefund: {
          refundId: refund.id,
          refundAmount: refund.refundAmount,
          refundPercentage: refund.refundPercentage,
        },
      };
    }
    await this.paymentRepo.save(payment);

    // Cancelar el registro
    const registration = refund.registration;
    registration.status = RegistrationStatus.CANCELLED;
    await this.registrationRepo.save(registration);

    // Emitir nota de crédito si hay comprobante fiscal
    const fiscalDoc = await this.fiscalService.findByPayment(payment.id);
    if (fiscalDoc) {
      const creditNote = await this.fiscalService.createCreditNote(
        {
          fiscalDocumentId: fiscalDoc.id,
          reason:
            refund.refundPercentage === 100
              ? CreditNoteReason.DEVOLUCION_TOTAL
              : CreditNoteReason.DEVOLUCION_PARCIAL,
          description: `Reembolso por: ${refund.reasonDetails || refund.reason}`,
          percentage: refund.refundPercentage,
        },
        admin,
      );
      refund.creditNote = creditNote;
    }

    // Marcar como completado
    refund.status = RefundStatus.COMPLETED;
    refund.completedAt = new Date();

    const saved = await this.refundRepo.save(refund);

    // Trigger notificación de reembolso aprobado
    await this.notificationTriggers.onRefundApproved(saved);

    this.logger.log(
      `💸 Reembolso procesado: ${refundId} - S/ ${refund.refundAmount}`,
    );

    return saved;
  }

  // ========== CONSULTAS ==========

  async findAll(filters?: {
    status?: RefundStatus;
    eventId?: string;
  }): Promise<Refund[]> {
    const query = this.refundRepo
      .createQueryBuilder('refund')
      .leftJoinAndSelect('refund.payment', 'payment')
      .leftJoinAndSelect('refund.registration', 'registration')
      .leftJoinAndSelect('registration.event', 'event')
      .leftJoinAndSelect('registration.attendee', 'attendee')
      .leftJoinAndSelect('refund.requestedBy', 'requestedBy')
      .leftJoinAndSelect('refund.reviewedBy', 'reviewedBy')
      .orderBy('refund.requestedAt', 'DESC');

    if (filters?.status) {
      query.andWhere('refund.status = :status', { status: filters.status });
    }

    if (filters?.eventId) {
      query.andWhere('event.id = :eventId', { eventId: filters.eventId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Refund> {
    const refund = await this.refundRepo.findOne({
      where: { id },
      relations: [
        'payment',
        'registration',
        'registration.event',
        'registration.attendee',
        'requestedBy',
        'reviewedBy',
        'processedBy',
        'creditNote',
      ],
    });

    if (!refund) {
      throw new NotFoundException(
        this.i18n.t('refunds.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return refund;
  }

  async findByUser(userId: string): Promise<Refund[]> {
    return this.refundRepo.find({
      where: { requestedBy: { id: userId } },
      relations: ['registration', 'registration.event'],
      order: { requestedAt: 'DESC' },
    });
  }

  // ========== POLÍTICAS ==========

  async createPolicy(data: Partial<RefundPolicy>): Promise<RefundPolicy> {
    const policy = this.policyRepo.create(data);
    return this.policyRepo.save(policy);
  }

  async getPolicies(eventId?: string): Promise<RefundPolicy[]> {
    if (eventId) {
      return this.policyRepo.find({
        where: [{ event: { id: eventId } }, { event: null as any }],
        order: { daysBeforeEvent: 'DESC' },
      });
    }
    return this.policyRepo.find({
      order: { daysBeforeEvent: 'DESC' },
    });
  }

  // ========== ESTADÍSTICAS ==========

  async getRefundStats(eventId?: string) {
    const query = this.refundRepo
      .createQueryBuilder('refund')
      .leftJoin('refund.registration', 'registration')
      .leftJoin('registration.event', 'event');

    if (eventId) {
      query.where('event.id = :eventId', { eventId });
    }

    const refunds = await query.getMany();

    const completed = refunds.filter(
      (r) => r.status === RefundStatus.COMPLETED,
    );
    const pending = refunds.filter((r) =>
      [
        RefundStatus.REQUESTED,
        RefundStatus.PENDING_REVIEW,
        RefundStatus.APPROVED,
        RefundStatus.PROCESSING,
      ].includes(r.status),
    );

    return {
      totalRequests: refunds.length,
      completed: completed.length,
      pending: pending.length,
      rejected: refunds.filter((r) => r.status === RefundStatus.REJECTED)
        .length,
      totalRefundedAmount: completed.reduce(
        (sum, r) => sum + Number(r.refundAmount),
        0,
      ),
      averageRefundPercentage:
        completed.length > 0
          ? completed.reduce((sum, r) => sum + r.refundPercentage, 0) /
            completed.length
          : 0,
    };
  }
}
