/**
 * Ejemplo de integración del MessagingModule con el sistema de notificaciones
 *
 * Este archivo muestra cómo integrar SMS y WhatsApp en diferentes flujos del sistema
 */

import { Injectable, Logger } from '@nestjs/common';
import { MessagingService } from '../messaging.service';
import { MailService } from '../../mail/mail.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class NotificationIntegrationExample {
  private readonly logger = new Logger(NotificationIntegrationExample.name);

  constructor(
    private readonly messagingService: MessagingService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Ejemplo 1: Notificación de pago confirmado
   * Envía por EMAIL + WhatsApp (si tiene teléfono)
   */
  async notifyPaymentConfirmed(payment: any): Promise<void> {
    const { registration } = payment;
    const { attendee, event } = registration;

    // 1. Email siempre (canal principal)
    await this.mailService.sendTicket(registration);

    // 2. WhatsApp si tiene teléfono configurado
    if (attendee.phone) {
      const result = await this.messagingService.sendPaymentConfirmationWhatsApp(
        attendee.phone,
        event.title,
        registration.ticketCode,
      );

      if (result.success) {
        this.logger.log(`WhatsApp sent to ${attendee.phone}: ${result.messageId}`);
      } else {
        this.logger.warn(`WhatsApp failed: ${result.errorMessage}`);
      }
    }

    // 3. Notificación in-app
    await this.notificationsService.notifyPaymentConfirmed(
      attendee.userId,
      payment.amount,
    );
  }

  /**
   * Ejemplo 2: Recordatorio de reserva por expirar
   * SMS solo si es URGENTE (menos de 10 minutos)
   */
  async notifyReservationExpiring(registration: any, minutesLeft: number): Promise<void> {
    const { attendee } = registration;

    // 1. Email siempre
    // await this.mailService.sendReservationExpiring(registration);

    // 2. SMS solo si es crítico (menos de 10 min)
    if (attendee.phone && minutesLeft <= 10) {
      const paymentLink = `${process.env.FRONTEND_URL}/pay/${registration.id}`;

      const result = await this.messagingService.sendPaymentReminder(
        attendee.phone,
        paymentLink,
      );

      if (result.success) {
        this.logger.log(`Urgent SMS sent: ${result.messageId}`);
      }
    }
  }

  /**
   * Ejemplo 3: Recordatorio de evento (24h antes)
   * Email + SMS
   */
  async notifyEventReminder(registration: any): Promise<void> {
    const { attendee, event } = registration;

    // 1. Email con detalles completos
    // await this.mailService.sendEventReminder(registration);

    // 2. SMS simple como recordatorio adicional
    if (attendee.phone) {
      await this.messagingService.sendEventReminder(
        attendee.phone,
        event.title,
      );
    }

    // 3. Notificación in-app
    await this.notificationsService.notifyUpcomingEvent(
      attendee.userId,
      event.title,
      event.id,
      1, // 1 día
    );
  }

  /**
   * Ejemplo 4: Certificado disponible
   * Email + SMS (link corto)
   */
  async notifyCertificateReady(certificate: any): Promise<void> {
    const { registration } = certificate;
    const { attendee } = registration;

    const certificateLink = `${process.env.FRONTEND_URL}/certificates/${certificate.id}`;

    // 1. Email con PDF adjunto
    // await this.mailService.sendCertificate(registration, certificate);

    // 2. SMS con link de descarga
    if (attendee.phone) {
      await this.messagingService.sendCertificateReady(
        attendee.phone,
        certificateLink,
      );
    }
  }

  /**
   * Ejemplo 5: Notificación multicanal con prioridades
   * Decide qué canales usar según urgencia y preferencias del usuario
   */
  async notifyMultiChannel(
    userId: string,
    phone: string | null,
    email: string,
    notification: {
      title: string;
      message: string;
      urgency: 'low' | 'medium' | 'high';
    },
  ): Promise<void> {
    const { title, message, urgency } = notification;

    // Notificación in-app siempre
    await this.notificationsService.create({
      userId,
      title,
      message,
    });

    if (urgency === 'high') {
      // Urgente: todos los canales
      // await this.mailService.send(email, title, message);

      if (phone) {
        await this.messagingService.sendSms(phone, `${title}: ${message}`);
      }
    } else if (urgency === 'medium') {
      // Medio: email + in-app
      // await this.mailService.send(email, title, message);
    } else {
      // Bajo: solo in-app (ya enviado arriba)
    }
  }

  /**
   * Ejemplo 6: Transferencia de ticket
   * Notificar al nuevo propietario por todos los canales
   */
  async notifyTicketTransfer(transfer: any): Promise<void> {
    const { newOwner, ticket, event } = transfer;

    // 1. Email con nuevo ticket
    // await this.mailService.sendTicketTransfer(newOwner.email, ticket);

    // 2. SMS con código de ticket
    if (newOwner.phone) {
      await this.messagingService.sendTicketTransferNotification(
        newOwner.phone,
        event.title,
        ticket.code,
      );
    }

    // 3. Notificación in-app
    if (newOwner.userId) {
      await this.notificationsService.create({
        userId: newOwner.userId,
        title: 'Ticket transferido',
        message: `Has recibido un ticket para ${event.title}`,
        link: `/dashboard/tickets/${ticket.id}`,
      });
    }
  }

  /**
   * Ejemplo 7: Notificación masiva (broadcast)
   * Enviar a múltiples usuarios con rate limiting
   */
  async sendBroadcast(
    recipients: Array<{ phone: string; name: string }>,
    message: string,
  ): Promise<void> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Procesar en lotes para evitar rate limiting
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      // Enviar batch en paralelo
      const promises = batch.map(async (recipient) => {
        const result = await this.messagingService.sendSms(
          recipient.phone,
          message,
        );

        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${recipient.phone}: ${result.errorMessage}`);
        }
      });

      await Promise.all(promises);

      // Esperar 1 segundo entre batches
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    this.logger.log(
      `Broadcast completed: ${results.success} success, ${results.failed} failed`,
    );

    if (results.errors.length > 0) {
      this.logger.error('Broadcast errors:', results.errors);
    }
  }

  /**
   * Ejemplo 8: Verificación de teléfono con código OTP
   */
  async sendVerificationCode(phone: string, code: string): Promise<boolean> {
    const message = `CIP Eventos - Tu código de verificación es: ${code}. Válido por 5 minutos.`;

    const result = await this.messagingService.sendSms(phone, message);

    if (!result.success) {
      this.logger.error(`Failed to send OTP to ${phone}: ${result.errorMessage}`);
    }

    return result.success;
  }

  /**
   * Ejemplo 9: Notificación de cambio de evento
   * Informar a todos los asistentes sobre cambios importantes
   */
  async notifyEventChange(
    event: any,
    changeType: 'date' | 'location' | 'cancellation',
    details: string,
  ): Promise<void> {
    const registrations: Array<{ attendee: { email: string; phone?: string } }> = [];
    // await this.registrationsRepository.find({ where: { eventId: event.id } });

    const message = this.buildChangeMessage(event.title, changeType, details);

    for (const registration of registrations) {
      const { attendee } = registration;

      // Email con detalles completos
      // await this.mailService.sendEventChange(attendee.email, event, changeType, details);

      // SMS/WhatsApp como notificación rápida
      if (attendee.phone) {
        if (changeType === 'cancellation') {
          // Cancelación: SMS urgente
          await this.messagingService.sendSms(attendee.phone, message);
        } else {
          // Otros cambios: WhatsApp si está disponible
          await this.messagingService.sendWhatsApp(attendee.phone, message);
        }
      }
    }
  }

  private buildChangeMessage(
    eventTitle: string,
    changeType: string,
    details: string,
  ): string {
    const messages = {
      date: `CAMBIO DE FECHA - ${eventTitle}: ${details}`,
      location: `CAMBIO DE UBICACIÓN - ${eventTitle}: ${details}`,
      cancellation: `EVENTO CANCELADO - ${eventTitle}: ${details}`,
    };

    return messages[changeType] || `Actualización - ${eventTitle}: ${details}`;
  }
}

/**
 * Notas de implementación:
 *
 * 1. Siempre manejar errores de manera graceful (no fallar si SMS falla)
 * 2. Implementar retry logic para mensajes críticos
 * 3. Registrar todos los envíos en notification_logs
 * 4. Respetar preferencias de usuario (opt-out)
 * 5. Cumplir con regulaciones (hora de envío, frecuencia, etc.)
 * 6. Monitorear costos y tasas de entrega
 * 7. Usar templates para mensajes comunes
 * 8. Validar números antes de enviar
 * 9. Implementar rate limiting
 * 10. Guardar messageId para tracking
 */
