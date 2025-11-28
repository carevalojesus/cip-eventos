import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReportPaymentDto } from './dto/report-payment.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';
import { PaypalService } from './paypal.service';
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
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Registration)
    private registrationRepo: Repository<Registration>,
    private readonly mailService: MailService,
    private readonly paypalService: PaypalService,
    private readonly i18n: I18nService,
  ) {}

  // 1. INICIAR PAGO
  async createPaymentIntent(dto: CreatePaymentDto, userId: string) {
    this.logger.log(`[createPaymentIntent] Iniciando pago para usuario ${userId}, registro ${dto.registrationId}`);

    // a. Buscar inscripción
    const registration = await this.registrationRepo.findOne({
      where: { id: dto.registrationId },
      relations: ['attendee', 'attendee.user', 'event'],
    });

    if (!registration) {
      this.logger.warn(`[createPaymentIntent] Registro no encontrado: ${dto.registrationId}`);
      throw new NotFoundException(
        this.i18n.t('payments.registration_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // b. Validaciones de seguridad
    if (registration.status === RegistrationStatus.CONFIRMED) {
      throw new BadRequestException(
        this.i18n.t('payments.already_paid', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException(
        this.i18n.t('payments.registration_cancelled', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar que el usuario logueado sea el dueño
    if (registration.attendee?.user?.id !== userId) {
      throw new BadRequestException(
        this.i18n.t('payments.no_permission', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const provider = dto.provider || PaymentProvider.SIMULATED;

    // CASO PAYPAL:
    if (provider === PaymentProvider.PAYPAL) {
      this.logger.log(`[createPaymentIntent] Creando orden PayPal para monto ${registration.finalPrice} PEN`);

      // Crear la Orden en PayPal primero
      const orderId = await this.paypalService.createOrder(
        registration.finalPrice,
        'PEN', // Cobro en Soles
      );

      this.logger.log(`[createPaymentIntent] Orden PayPal creada: ${orderId}`);

      // Guardamos el pago en estado PENDING con el ID de PayPal
      const payment = this.paymentRepo.create({
        amount: registration.finalPrice,
        currency: 'PEN',
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.PAYPAL,
        registration: registration,
        transactionId: orderId, // Guardamos el OrderID aquí temporalmente
      });

      await this.paymentRepo.save(payment);

      this.logger.log(`[createPaymentIntent] Pago creado exitosamente: ${payment.id}, PayPal Order: ${orderId}`);

      return {
        paymentId: payment.id,
        provider: 'PAYPAL',
        paypalOrderId: orderId, // 👈 El frontend usará esto para el botón
      };
    }

    // c. Crear registro de pago PENDING (Simulado / Otros)
    const payment = this.paymentRepo.create({
      amount: registration.finalPrice,
      currency: 'PEN',
      status: PaymentStatus.PENDING,
      provider: PaymentProvider.SIMULATED,
      registration: registration,
      transactionId: `TX-${uuidv4().slice(0, 8).toUpperCase()}`, // ID falso de banco
    });

    await this.paymentRepo.save(payment);

    // d. Retornar "Link de Pago"
    // En producción, aquí llamarías a Stripe/Niubiz y devolverías su URL.
    // Aquí devolvemos nuestra URL de simulación.
    return {
      message: this.i18n.t('payments.payment_intent_created', {
        lang: I18nContext.current()?.lang,
      }),
      paymentId: payment.id,
      amount: payment.amount,
      transactionId: payment.transactionId,
      // URL Falsa para simular que el usuario paga en el frontend
      checkoutUrl: `http://localhost:3000/api/payments/simulate-success?token=${payment.transactionId}`,
    };
  }

  // 2.1 COMPLETAR PAGO PAYPAL (CAPTURE)
  async completePaypalPayment(
    paymentId: string,
    paypalOrderId: string,
    userId: string,
  ) {
    this.logger.log(`[completePaypalPayment] Capturando pago PayPal - Payment: ${paymentId}, Order: ${paypalOrderId}, User: ${userId}`);

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: [
        'registration',
        'registration.attendee',
        'registration.attendee.user',
        'registration.event',
        'registration.event.location',
      ],
    });

    if (!payment) {
      this.logger.warn(`[completePaypalPayment] Pago no encontrado: ${paymentId}`);
      throw new NotFoundException(
        this.i18n.t('payments.payment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log(`[completePaypalPayment] Pago ya completado previamente: ${paymentId}`);
      return {
        message: this.i18n.t('payments.already_completed', {
          lang: I18nContext.current()?.lang,
        }),
      };
    }

    // Validación de seguridad: Verificar que el usuario sea el dueño del pago
    if (payment.registration.attendee?.user?.id !== userId) {
      throw new BadRequestException(
        this.i18n.t('payments.no_permission_capture', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validación de seguridad: El ID que nos envían debe coincidir con el guardado
    if (payment.transactionId !== paypalOrderId) {
      throw new BadRequestException(
        this.i18n.t('payments.order_id_mismatch', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // CAPTURAR EL DINERO REALMENTE (Server-to-Server)
    this.logger.log(`[completePaypalPayment] Capturando pago en PayPal: ${paypalOrderId}`);
    const captureResult =
      await this.paypalService.capturePayment(paypalOrderId);

    if (captureResult.success) {
      this.logger.log(`[completePaypalPayment] Captura exitosa - PayPal Order: ${paypalOrderId}, Payment: ${paymentId}`);

      payment.status = PaymentStatus.COMPLETED;
      payment.metadata = captureResult.metadata;
      await this.paymentRepo.save(payment);

      // Confirmar Inscripción y Enviar Ticket
      const registration = payment.registration;
      registration.status = RegistrationStatus.CONFIRMED;
      await this.registrationRepo.save(registration);

      this.logger.log(`[completePaypalPayment] Inscripción confirmada: ${registration.id}, enviando ticket por email`);

      // Usar nuevo formato: pasar registration completo (incluye Google Wallet)
      await this.mailService.sendTicket(registration);

      this.logger.log(`[completePaypalPayment] Proceso completado exitosamente - Payment: ${paymentId}, Registration: ${registration.id}`);

      return {
        message: this.i18n.t('payments.paypal_success', {
          lang: I18nContext.current()?.lang,
        }),
      };
    } else {
      this.logger.error(`[completePaypalPayment] Captura fallida - PayPal Order: ${paypalOrderId}, Payment: ${paymentId}`);
      throw new BadRequestException(
        this.i18n.t('payments.paypal_not_approved', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
  }

  async reportPayment(
    paymentId: string,
    dto: ReportPaymentDto,
    userId: string,
  ) {
    this.logger.log(`[reportPayment] Usuario ${userId} reportando pago ${paymentId} - Provider: ${dto.provider}, Op: ${dto.operationCode}`);

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: [
        'registration',
        'registration.attendee',
        'registration.attendee.user',
      ],
    });

    if (!payment) {
      this.logger.warn(`[reportPayment] Pago no encontrado: ${paymentId}`);
      throw new NotFoundException(
        this.i18n.t('payments.payment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar que el usuario sea el dueño (opcional pero recomendado)
    if (payment.registration.attendee?.user?.id !== userId) {
      throw new BadRequestException(
        this.i18n.t('payments.no_permission_report', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        this.i18n.t('payments.payment_completed', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Actualizamos datos
    payment.provider = dto.provider;
    payment.operationCode = dto.operationCode;
    payment.evidenceUrl = dto.evidenceUrl ?? null;
    payment.status = PaymentStatus.WAITING_APPROVAL; // 👈 Cambia estado
    payment.rejectionReason = null; // Limpiamos rechazos previos si reintenta

    const savedPayment = await this.paymentRepo.save(payment);
    this.logger.log(`[reportPayment] Pago reportado exitosamente: ${paymentId}, Estado: WAITING_APPROVAL`);

    return savedPayment;
  }

  // 👇 4. ADMIN REVISA PAGO (Conciliación)
  async reviewPayment(
    paymentId: string,
    dto: ReviewPaymentDto,
    adminUser: User,
  ) {
    this.logger.log(`[reviewPayment] Admin ${adminUser.email} revisando pago ${paymentId} - Aprobado: ${dto.isApproved}`);

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: [
        'registration',
        'registration.attendee',
        'registration.event',
        'registration.event.location',
      ],
    });

    if (!payment) {
      this.logger.warn(`[reviewPayment] Pago no encontrado: ${paymentId}`);
      throw new NotFoundException(
        this.i18n.t('payments.payment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.warn(`[reviewPayment] Pago ya completado: ${paymentId}`);
      throw new BadRequestException(
        this.i18n.t('payments.already_completed_review', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (dto.isApproved) {
      // ✅ APROBAR
      this.logger.log(`[reviewPayment] Aprobando pago ${paymentId}`);
      payment.status = PaymentStatus.COMPLETED;
      payment.reviewedBy = adminUser;

      // Actualizar Inscripción
      payment.registration.status = RegistrationStatus.CONFIRMED;
      await this.registrationRepo.save(payment.registration);

      this.logger.log(`[reviewPayment] Inscripción confirmada: ${payment.registration.id}, enviando ticket`);

      // Enviar Ticket con Google Wallet incluido
      await this.mailService.sendTicket(payment.registration);

      this.logger.log(`[reviewPayment] Pago aprobado exitosamente: ${paymentId}, Admin: ${adminUser.email}`);
    } else {
      // ❌ RECHAZAR
      this.logger.log(`[reviewPayment] Rechazando pago ${paymentId} - Razón: ${dto.rejectionReason}`);
      payment.status = PaymentStatus.REJECTED;
      payment.rejectionReason = dto.rejectionReason || 'Datos inconsistentes';
      payment.reviewedBy = adminUser;

      this.logger.log(`[reviewPayment] Pago rechazado: ${paymentId}, Email: ${payment.registration.attendee.email}`);
    }

    return await this.paymentRepo.save(payment);
  }
}
