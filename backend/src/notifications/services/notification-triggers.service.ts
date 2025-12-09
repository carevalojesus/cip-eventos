import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications.service';
import { EmailQueueService } from '../../queue/services/email-queue.service';
import { NotificationLog } from '../entities/notification-log.entity';
import {
  NotificationChannel,
  NotificationStatus,
} from '../enums/notification-status.enum';
import { Registration } from '../../registrations/entities/registration.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { Refund } from '../../refunds/entities/refund.entity';
import { EventSession } from '../../events/entities/event-session.entity';
import { NotificationType } from '../entities/notification.entity';

/**
 * Servicio de triggers de notificaciones
 * Maneja todos los eventos que disparan notificaciones automáticas
 */
@Injectable()
export class NotificationTriggersService {
  private readonly logger = new Logger(NotificationTriggersService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepo: Repository<NotificationLog>,
    private readonly notificationsService: NotificationsService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  /**
   * Verifica si ya se envió una notificación para evitar duplicados
   */
  private async wasNotificationSent(
    type: string,
    entityType: string,
    entityId: string,
    channel: NotificationChannel,
  ): Promise<boolean> {
    const existing = await this.notificationLogRepo.findOne({
      where: {
        type,
        entityType,
        entityId,
        channel,
        status: NotificationStatus.SENT,
      },
    });

    return !!existing;
  }

  /**
   * Registra un log de notificación
   */
  private async logNotification(
    type: string,
    channel: NotificationChannel,
    recipientEmail: string,
    recipientUserId: string | null,
    entityType: string,
    entityId: string,
    metadata?: any,
  ): Promise<NotificationLog> {
    const log = this.notificationLogRepo.create({
      type,
      channel,
      recipientEmail,
      recipientUserId,
      entityType,
      entityId,
      status: NotificationStatus.QUEUED,
      metadata,
    });

    return this.notificationLogRepo.save(log);
  }

  /**
   * Marca un log como enviado
   */
  async markNotificationSent(logId: string): Promise<void> {
    await this.notificationLogRepo.update(logId, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
  }

  /**
   * Marca un log como fallido
   */
  async markNotificationFailed(logId: string, error: string): Promise<void> {
    await this.notificationLogRepo.update(logId, {
      status: NotificationStatus.FAILED,
      errorMessage: error,
    });
  }

  /**
   * 1. Trigger: Inscripción pendiente creada
   * Email con resumen del pedido y link de pago
   */
  async onRegistrationCreated(registration: Registration): Promise<void> {
    try {
      const email = registration.attendee.email;
      const userId = registration.attendee.user?.id || null;

      // Verificar si ya se envió
      const alreadySent = await this.wasNotificationSent(
        'REGISTRATION_PENDING',
        'Registration',
        registration.id,
        NotificationChannel.EMAIL,
      );

      if (alreadySent) {
        this.logger.warn(
          `Registration pending email already sent for ${registration.id}`,
        );
        return;
      }

      // Registrar log
      await this.logNotification(
        'REGISTRATION_PENDING',
        NotificationChannel.EMAIL,
        email,
        userId,
        'Registration',
        registration.id,
      );

      // Encolar email
      await this.emailQueueService.queueRegistrationPendingEmail(
        registration.id,
      );

      // Notificación in-app si tiene cuenta
      if (userId) {
        await this.notificationsService.create({
          type: NotificationType.INFO,
          title: 'Inscripción pendiente',
          message: `Tu inscripción a "${registration.event.title}" está pendiente de pago`,
          link: `/dashboard/registrations/${registration.id}`,
          userId,
        });
      }

      this.logger.log(
        `Registration pending notification triggered for ${registration.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger registration pending notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 2. Trigger: Pago aprobado
   * Email con confirmación, ticket QR y comprobante fiscal
   */
  async onPaymentCompleted(payment: Payment): Promise<void> {
    try {
      const registration = payment.registration;
      const email = registration.attendee.email;
      const userId = registration.attendee.user?.id || null;

      // Verificar si ya se envió
      const alreadySent = await this.wasNotificationSent(
        'PAYMENT_CONFIRMED',
        'Payment',
        payment.id,
        NotificationChannel.EMAIL,
      );

      if (alreadySent) {
        this.logger.warn(
          `Payment confirmed email already sent for ${payment.id}`,
        );
        return;
      }

      // Registrar log
      await this.logNotification(
        'PAYMENT_CONFIRMED',
        NotificationChannel.EMAIL,
        email,
        userId,
        'Payment',
        payment.id,
      );

      // Encolar email
      await this.emailQueueService.queuePaymentConfirmedEmail(payment.id);

      // Notificación in-app si tiene cuenta
      if (userId) {
        await this.notificationsService.create({
          type: NotificationType.SUCCESS,
          title: 'Pago confirmado',
          message: `Tu pago de ${payment.currency} ${payment.amount} ha sido confirmado`,
          link: `/dashboard/payments/${payment.id}`,
          userId,
        });
      }

      this.logger.log(
        `Payment confirmed notification triggered for ${payment.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger payment confirmed notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 3. Trigger: Reserva por expirar
   * Email recordatorio urgente
   */
  async onReservationExpiringSoon(
    registration: Registration,
    minutesLeft: number,
  ): Promise<void> {
    try {
      const email = registration.attendee.email;
      const userId = registration.attendee.user?.id || null;

      // Verificar si ya se envió recordatorio
      const alreadySent = await this.wasNotificationSent(
        'RESERVATION_EXPIRING',
        'Registration',
        registration.id,
        NotificationChannel.EMAIL,
      );

      if (alreadySent) {
        this.logger.warn(
          `Reservation expiring email already sent for ${registration.id}`,
        );
        return;
      }

      // Registrar log
      await this.logNotification(
        'RESERVATION_EXPIRING',
        NotificationChannel.EMAIL,
        email,
        userId,
        'Registration',
        registration.id,
        { minutesLeft },
      );

      // Encolar email
      await this.emailQueueService.queueReservationExpiringEmail(
        registration.id,
        minutesLeft,
      );

      // Notificación in-app si tiene cuenta
      if (userId) {
        await this.notificationsService.create({
          type: NotificationType.WARNING,
          title: 'Reserva por expirar',
          message: `Tu reserva para "${registration.event.title}" expira en ${minutesLeft} minutos`,
          link: `/dashboard/registrations/${registration.id}`,
          userId,
        });
      }

      this.logger.log(
        `Reservation expiring notification triggered for ${registration.id} (${minutesLeft} min left)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger reservation expiring notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 4. Trigger: Reserva expirada
   * Email informando que venció
   */
  async onReservationExpired(registration: Registration): Promise<void> {
    try {
      const email = registration.attendee.email;
      const userId = registration.attendee.user?.id || null;

      // Verificar si ya se envió
      const alreadySent = await this.wasNotificationSent(
        'RESERVATION_EXPIRED',
        'Registration',
        registration.id,
        NotificationChannel.EMAIL,
      );

      if (alreadySent) {
        this.logger.warn(
          `Reservation expired email already sent for ${registration.id}`,
        );
        return;
      }

      // Registrar log
      await this.logNotification(
        'RESERVATION_EXPIRED',
        NotificationChannel.EMAIL,
        email,
        userId,
        'Registration',
        registration.id,
      );

      // Encolar email
      await this.emailQueueService.queueReservationExpiredEmail(
        registration.id,
      );

      // Notificación in-app si tiene cuenta
      if (userId) {
        await this.notificationsService.create({
          type: NotificationType.ERROR,
          title: 'Reserva expirada',
          message: `Tu reserva para "${registration.event.title}" ha expirado`,
          link: `/events/${registration.event.id}`,
          userId,
        });
      }

      this.logger.log(
        `Reservation expired notification triggered for ${registration.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger reservation expired notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 5. Trigger: Cambio en agenda (cancelación/reprogramación de sesión)
   * Email masivo a todos los inscritos afectados
   */
  async onSessionChanged(
    session: EventSession,
    changeType: 'cancelled' | 'rescheduled',
    oldData?: any,
  ): Promise<void> {
    try {
      // Registrar log para la sesión
      await this.logNotification(
        'SESSION_CHANGED',
        NotificationChannel.EMAIL,
        'multiple', // Email masivo
        null,
        'EventSession',
        session.id,
        { changeType, oldData },
      );

      // Encolar email (el processor se encargará de obtener los inscritos)
      await this.emailQueueService.queueSessionChangedEmail(
        session.id,
        changeType,
        oldData,
      );

      this.logger.log(
        `Session changed notification triggered for ${session.id} (${changeType})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger session changed notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 6. Trigger: Certificado disponible
   * Email con link de descarga
   */
  async onCertificateIssued(certificate: Certificate): Promise<void> {
    try {
      // Obtener email según el tipo de certificado
      let email: string;
      let userId: string | null = null;

      if (certificate.registration) {
        email = certificate.registration.attendee.email;
        userId = certificate.registration.attendee.user?.id || null;
      } else if (certificate.user) {
        email = certificate.user.email;
        userId = certificate.user.id;
      } else if (certificate.speaker) {
        email = certificate.speaker.email;
        userId = null;
      } else {
        this.logger.warn(
          `Cannot determine recipient for certificate ${certificate.id}`,
        );
        return;
      }

      // Verificar si ya se envió
      const alreadySent = await this.wasNotificationSent(
        'CERTIFICATE_READY',
        'Certificate',
        certificate.id,
        NotificationChannel.EMAIL,
      );

      if (alreadySent) {
        this.logger.warn(
          `Certificate ready email already sent for ${certificate.id}`,
        );
        return;
      }

      // Registrar log
      await this.logNotification(
        'CERTIFICATE_READY',
        NotificationChannel.EMAIL,
        email,
        userId,
        'Certificate',
        certificate.id,
      );

      // Encolar email
      await this.emailQueueService.queueCertificateReadyEmail(certificate.id);

      // Notificación in-app si tiene cuenta
      if (userId) {
        await this.notificationsService.create({
          type: NotificationType.SUCCESS,
          title: 'Certificado disponible',
          message: `Tu certificado para "${certificate.event.title}" está listo para descargar`,
          link: `/dashboard/certificates/${certificate.id}`,
          userId,
        });
      }

      this.logger.log(
        `Certificate ready notification triggered for ${certificate.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger certificate ready notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 7. Trigger: Reembolso aprobado
   * Email con importe devuelto y detalles
   */
  async onRefundApproved(refund: Refund): Promise<void> {
    try {
      const email = refund.registration.attendee.email;
      const userId = refund.registration.attendee.user?.id || null;

      // Verificar si ya se envió
      const alreadySent = await this.wasNotificationSent(
        'REFUND_APPROVED',
        'Refund',
        refund.id,
        NotificationChannel.EMAIL,
      );

      if (alreadySent) {
        this.logger.warn(
          `Refund approved email already sent for ${refund.id}`,
        );
        return;
      }

      // Registrar log
      await this.logNotification(
        'REFUND_APPROVED',
        NotificationChannel.EMAIL,
        email,
        userId,
        'Refund',
        refund.id,
      );

      // Encolar email
      await this.emailQueueService.queueRefundApprovedEmail(refund.id);

      // Notificación in-app si tiene cuenta
      if (userId) {
        await this.notificationsService.create({
          type: NotificationType.SUCCESS,
          title: 'Reembolso aprobado',
          message: `Tu reembolso de ${refund.currency} ${refund.refundAmount} ha sido aprobado`,
          link: `/dashboard/refunds/${refund.id}`,
          userId,
        });
      }

      this.logger.log(
        `Refund approved notification triggered for ${refund.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger refund approved notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 8. Trigger: Cortesía otorgada
   * Email informando de la cortesía
   */
  async onCourtesyGranted(courtesyId: string): Promise<void> {
    try {
      // Registrar log
      await this.logNotification(
        'COURTESY_GRANTED',
        NotificationChannel.EMAIL,
        'courtesy-recipient', // Se resolverá en el processor
        null,
        'Courtesy',
        courtesyId,
      );

      // Encolar email
      await this.emailQueueService.queueCourtesyGrantedEmail(courtesyId);

      this.logger.log(`Courtesy granted notification triggered for ${courtesyId}`);
    } catch (error) {
      this.logger.error(
        `Failed to trigger courtesy granted notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 9. Trigger: Invitación de lista de espera
   * Email con link de compra temporal
   */
  async onWaitlistInvited(waitlistEntryId: string): Promise<void> {
    try {
      // Registrar log
      await this.logNotification(
        'WAITLIST_INVITED',
        NotificationChannel.EMAIL,
        'waitlist-recipient', // Se resolverá en el processor
        null,
        'WaitlistEntry',
        waitlistEntryId,
      );

      // Encolar email
      await this.emailQueueService.queueWaitlistInvitedEmail(waitlistEntryId);

      this.logger.log(
        `Waitlist invited notification triggered for ${waitlistEntryId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger waitlist invited notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 10. Trigger: Transferencia de ticket
   * Email al nuevo titular y al anterior
   */
  async onTicketTransferred(transferId: string): Promise<void> {
    try {
      // Registrar log
      await this.logNotification(
        'TICKET_TRANSFERRED',
        NotificationChannel.EMAIL,
        'transfer-participants', // Se resolverá en el processor
        null,
        'TicketTransfer',
        transferId,
      );

      // Encolar email
      await this.emailQueueService.queueTicketTransferredEmail(transferId);

      this.logger.log(
        `Ticket transferred notification triggered for ${transferId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger ticket transferred notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
