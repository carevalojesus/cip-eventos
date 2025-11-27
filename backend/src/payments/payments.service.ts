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
    // a. Buscar inscripción
    const registration = await this.registrationRepo.findOne({
      where: { id: dto.registrationId },
      relations: ['attendee', 'attendee.user', 'event'],
    });

    if (!registration)
      throw new NotFoundException(
        this.i18n.t('payments.registration_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );

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
      // Crear la Orden en PayPal primero
      const orderId = await this.paypalService.createOrder(
        registration.finalPrice,
        'PEN', // Cobro en Soles
      );

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

    if (!payment)
      throw new NotFoundException(
        this.i18n.t('payments.payment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    if (payment.status === PaymentStatus.COMPLETED)
      return {
        message: this.i18n.t('payments.already_completed', {
          lang: I18nContext.current()?.lang,
        }),
      };

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
    const captureResult =
      await this.paypalService.capturePayment(paypalOrderId);

    if (captureResult.success) {
      payment.status = PaymentStatus.COMPLETED;
      payment.metadata = captureResult.metadata;
      await this.paymentRepo.save(payment);

      // Confirmar Inscripción y Enviar Ticket
      const registration = payment.registration;
      registration.status = RegistrationStatus.CONFIRMED;
      await this.registrationRepo.save(registration);

      // Usar nuevo formato: pasar registration completo (incluye Google Wallet)
      await this.mailService.sendTicket(registration);

      return {
        message: this.i18n.t('payments.paypal_success', {
          lang: I18nContext.current()?.lang,
        }),
      };
    } else {
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
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: [
        'registration',
        'registration.attendee',
        'registration.attendee.user',
      ],
    });

    if (!payment)
      throw new NotFoundException(
        this.i18n.t('payments.payment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );

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

    return await this.paymentRepo.save(payment);
  }

  // 👇 4. ADMIN REVISA PAGO (Conciliación)
  async reviewPayment(
    paymentId: string,
    dto: ReviewPaymentDto,
    adminUser: User,
  ) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: [
        'registration',
        'registration.attendee',
        'registration.event',
        'registration.event.location',
      ],
    });

    if (!payment)
      throw new NotFoundException(
        this.i18n.t('payments.payment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    if (payment.status === PaymentStatus.COMPLETED)
      throw new BadRequestException(
        this.i18n.t('payments.already_completed_review', {
          lang: I18nContext.current()?.lang,
        }),
      );

    if (dto.isApproved) {
      // ✅ APROBAR
      payment.status = PaymentStatus.COMPLETED;
      payment.reviewedBy = adminUser;

      // Actualizar Inscripción
      payment.registration.status = RegistrationStatus.CONFIRMED;
      await this.registrationRepo.save(payment.registration);

      // Enviar Ticket con Google Wallet incluido
      await this.mailService.sendTicket(payment.registration);
    } else {
      // ❌ RECHAZAR
      payment.status = PaymentStatus.REJECTED;
      payment.rejectionReason = dto.rejectionReason || 'Datos inconsistentes';
      payment.reviewedBy = adminUser;

      // Opcional: Enviar correo de "Pago Rechazado"
      this.logger.log(
        `Enviar email de rechazo a ${payment.registration.attendee.email}`,
      );
    }

    return await this.paymentRepo.save(payment);
  }
}
