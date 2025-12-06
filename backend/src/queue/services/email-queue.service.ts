import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../constants';
import { EmailJob, EmailJobType } from '../types/email-jobs.types';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
  ) {}

  /**
   * Encolar email de bienvenida
   */
  async queueWelcomeEmail(email: string, name: string, token: string) {
    const job: EmailJob = {
      type: EmailJobType.WELCOME,
      data: { email, name, token },
    };

    await this.emailQueue.add(EmailJobType.WELCOME, job, {
      priority: 1, // Alta prioridad
    });

    this.logger.log(`Welcome email queued for ${email}`);
  }

  /**
   * Encolar email de reset de password
   */
  async queuePasswordResetEmail(email: string, name: string, token: string) {
    const job: EmailJob = {
      type: EmailJobType.PASSWORD_RESET,
      data: { email, name, token },
    };

    await this.emailQueue.add(EmailJobType.PASSWORD_RESET, job, {
      priority: 1, // Alta prioridad
    });

    this.logger.log(`Password reset email queued for ${email}`);
  }

  /**
   * Encolar email de cuenta confirmada
   */
  async queueAccountConfirmedEmail(email: string, name: string) {
    const job: EmailJob = {
      type: EmailJobType.ACCOUNT_CONFIRMED,
      data: { email, name },
    };

    await this.emailQueue.add(EmailJobType.ACCOUNT_CONFIRMED, job, {
      priority: 2, // Prioridad media
    });

    this.logger.log(`Account confirmed email queued for ${email}`);
  }

  /**
   * Encolar email de ticket
   */
  async queueTicketEmail(registrationId: string) {
    const job: EmailJob = {
      type: EmailJobType.TICKET,
      data: { registrationId },
    };

    await this.emailQueue.add(EmailJobType.TICKET, job, {
      priority: 2, // Prioridad media
    });

    this.logger.log(`Ticket email queued for registration ${registrationId}`);
  }

  /**
   * Encolar email de inscripción pendiente
   */
  async queueRegistrationPendingEmail(registrationId: string) {
    const job: EmailJob = {
      type: EmailJobType.REGISTRATION_PENDING,
      data: { registrationId },
    };

    await this.emailQueue.add(EmailJobType.REGISTRATION_PENDING, job, {
      priority: 2,
    });

    this.logger.log(
      `Registration pending email queued for registration ${registrationId}`,
    );
  }

  /**
   * Encolar email de pago confirmado
   */
  async queuePaymentConfirmedEmail(paymentId: string) {
    const job: EmailJob = {
      type: EmailJobType.PAYMENT_CONFIRMED,
      data: { paymentId },
    };

    await this.emailQueue.add(EmailJobType.PAYMENT_CONFIRMED, job, {
      priority: 1, // Alta prioridad
    });

    this.logger.log(`Payment confirmed email queued for payment ${paymentId}`);
  }

  /**
   * Encolar email de reserva por expirar
   */
  async queueReservationExpiringEmail(
    registrationId: string,
    minutesLeft: number,
  ) {
    const job: EmailJob = {
      type: EmailJobType.RESERVATION_EXPIRING,
      data: { registrationId, minutesLeft },
    };

    await this.emailQueue.add(EmailJobType.RESERVATION_EXPIRING, job, {
      priority: 1, // Alta prioridad
    });

    this.logger.log(
      `Reservation expiring email queued for registration ${registrationId} (${minutesLeft} minutes left)`,
    );
  }

  /**
   * Encolar email de reserva expirada
   */
  async queueReservationExpiredEmail(registrationId: string) {
    const job: EmailJob = {
      type: EmailJobType.RESERVATION_EXPIRED,
      data: { registrationId },
    };

    await this.emailQueue.add(EmailJobType.RESERVATION_EXPIRED, job, {
      priority: 3, // Prioridad baja
    });

    this.logger.log(
      `Reservation expired email queued for registration ${registrationId}`,
    );
  }

  /**
   * Encolar email de cambio en sesión
   */
  async queueSessionChangedEmail(
    sessionId: string,
    changeType: 'cancelled' | 'rescheduled',
    oldData?: any,
  ) {
    const job: EmailJob = {
      type: EmailJobType.SESSION_CHANGED,
      data: { sessionId, changeType, oldData },
    };

    await this.emailQueue.add(EmailJobType.SESSION_CHANGED, job, {
      priority: 1, // Alta prioridad
    });

    this.logger.log(
      `Session changed email queued for session ${sessionId} (${changeType})`,
    );
  }

  /**
   * Encolar email de certificado disponible
   */
  async queueCertificateReadyEmail(certificateId: string) {
    const job: EmailJob = {
      type: EmailJobType.CERTIFICATE_READY,
      data: { certificateId },
    };

    await this.emailQueue.add(EmailJobType.CERTIFICATE_READY, job, {
      priority: 2,
    });

    this.logger.log(
      `Certificate ready email queued for certificate ${certificateId}`,
    );
  }

  /**
   * Encolar email de reembolso aprobado
   */
  async queueRefundApprovedEmail(refundId: string) {
    const job: EmailJob = {
      type: EmailJobType.REFUND_APPROVED,
      data: { refundId },
    };

    await this.emailQueue.add(EmailJobType.REFUND_APPROVED, job, {
      priority: 1, // Alta prioridad
    });

    this.logger.log(`Refund approved email queued for refund ${refundId}`);
  }

  /**
   * Encolar email de cortesía otorgada
   */
  async queueCourtesyGrantedEmail(courtesyId: string) {
    const job: EmailJob = {
      type: EmailJobType.COURTESY_GRANTED,
      data: { courtesyId },
    };

    await this.emailQueue.add(EmailJobType.COURTESY_GRANTED, job, {
      priority: 2,
    });

    this.logger.log(
      `Courtesy granted email queued for courtesy ${courtesyId}`,
    );
  }

  /**
   * Encolar email de invitación de lista de espera
   */
  async queueWaitlistInvitedEmail(waitlistEntryId: string) {
    const job: EmailJob = {
      type: EmailJobType.WAITLIST_INVITED,
      data: { waitlistEntryId },
    };

    await this.emailQueue.add(EmailJobType.WAITLIST_INVITED, job, {
      priority: 1, // Alta prioridad
    });

    this.logger.log(
      `Waitlist invited email queued for entry ${waitlistEntryId}`,
    );
  }

  /**
   * Encolar email de ticket transferido
   */
  async queueTicketTransferredEmail(transferId: string) {
    const job: EmailJob = {
      type: EmailJobType.TICKET_TRANSFERRED,
      data: { transferId },
    };

    await this.emailQueue.add(EmailJobType.TICKET_TRANSFERRED, job, {
      priority: 2,
    });

    this.logger.log(
      `Ticket transferred email queued for transfer ${transferId}`,
    );
  }

  /**
   * Encolar email de reporte programado
   */
  async queueScheduledReportEmail(
    scheduledReportId: string,
    recipients: string[],
    reportName: string,
    fileBuffer: Buffer,
    fileExtension: string,
  ) {
    const job: EmailJob = {
      type: EmailJobType.SCHEDULED_REPORT,
      data: {
        scheduledReportId,
        recipients,
        reportName,
        fileBuffer,
        fileExtension,
      },
    };

    await this.emailQueue.add(EmailJobType.SCHEDULED_REPORT, job, {
      priority: 2, // Prioridad media
    });

    this.logger.log(
      `Scheduled report email queued for report ${scheduledReportId} to ${recipients.length} recipients`,
    );
  }

  /**
   * Obtener estadísticas de la cola
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}
