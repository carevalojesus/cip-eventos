import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReportPaymentDto } from './dto/report-payment.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';
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
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Registration)
    private registrationRepo: Repository<Registration>,
    private readonly mailService: MailService,
  ) {}

  // 1. INICIAR PAGO
  async createPaymentIntent(dto: CreatePaymentDto, userId: string) {
    // a. Buscar inscripción
    const registration = await this.registrationRepo.findOne({
      where: { id: dto.registrationId },
      relations: ['attendee', 'attendee.user', 'event'],
    });

    if (!registration) throw new NotFoundException('Inscripción no encontrada');

    // b. Validaciones de seguridad
    if (registration.status === RegistrationStatus.CONFIRMED) {
      throw new BadRequestException(
        'Esta inscripción ya está pagada/confirmada',
      );
    }
    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Esta inscripción fue cancelada');
    }

    // Validar que el usuario logueado sea el dueño
    if (registration.attendee?.user?.id !== userId) {
      throw new BadRequestException(
        'No tienes permiso para pagar esta inscripción',
      );
    }

    // c. Crear registro de pago PENDING
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
      message: 'Intención de pago creada',
      paymentId: payment.id,
      amount: payment.amount,
      transactionId: payment.transactionId,
      // URL Falsa para simular que el usuario paga en el frontend
      checkoutUrl: `http://localhost:3000/api/payments/simulate-success?token=${payment.transactionId}`,
    };
  }

  // 2. WEBHOOK (Confirmación del Banco)
  // Este método sería llamado por Stripe/Niubiz automáticamente
  async handlePaymentSuccess(transactionId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { transactionId },
      relations: [
        'registration',
        'registration.attendee',
        'registration.event',
        'registration.event.location',
      ],
    });

    if (!payment) throw new NotFoundException('Transacción no encontrada');
    if (payment.status === PaymentStatus.COMPLETED)
      return { message: 'Ya procesado' };

    // a. Actualizar Pago
    payment.status = PaymentStatus.COMPLETED;
    payment.metadata = { provider_response: 'APPROVED', timestamp: new Date() };
    await this.paymentRepo.save(payment);

    // b. Actualizar Inscripción
    const registration = payment.registration;
    registration.status = RegistrationStatus.CONFIRMED;
    await this.registrationRepo.save(registration);

    // c. Enviar Ticket
    const { attendee, event } = registration;
    await this.mailService.sendTicket(
      attendee.email,
      attendee.firstName,
      event.title,
      registration.ticketCode,
      event.startAt.toString(),
      event.location ? event.location.address : 'Virtual',
    );

    return { message: 'Pago exitoso. Ticket enviado.' };
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

    if (!payment) throw new NotFoundException('Pago no encontrado');

    // Validar que el usuario sea el dueño (opcional pero recomendado)
    if (payment.registration.attendee?.user?.id !== userId) {
      throw new BadRequestException(
        'No tienes permiso para reportar este pago',
      );
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Este pago ya fue completado');
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

    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status === PaymentStatus.COMPLETED)
      throw new BadRequestException('Ya completado');

    if (dto.isApproved) {
      // ✅ APROBAR
      payment.status = PaymentStatus.COMPLETED;
      payment.reviewedBy = adminUser;

      // Actualizar Inscripción
      payment.registration.status = RegistrationStatus.CONFIRMED;
      await this.registrationRepo.save(payment.registration);

      // Enviar Ticket
      const { attendee, event } = payment.registration;
      await this.mailService.sendTicket(
        attendee.email,
        attendee.firstName,
        event.title,
        payment.registration.ticketCode,
        event.startAt.toString(),
        event.location ? event.location.address : 'Virtual',
      );
    } else {
      // ❌ RECHAZAR
      payment.status = PaymentStatus.REJECTED;
      payment.rejectionReason = dto.rejectionReason || 'Datos inconsistentes';
      payment.reviewedBy = adminUser;

      // Opcional: Enviar correo de "Pago Rechazado"
      console.log(
        `Enviar email de rechazo a ${payment.registration.attendee.email}`,
      );
    }

    return await this.paymentRepo.save(payment);
  }
}
