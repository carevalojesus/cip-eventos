import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

export interface CreateNotificationDto {
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
  userId: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create({
      type: dto.type || NotificationType.INFO,
      title: dto.title,
      message: dto.message,
      link: dto.link || null,
      userId: dto.userId,
    });

    const saved = await this.notificationRepo.save(notification);
    this.logger.log(
      `[create] Notificación creada para usuario ${dto.userId}: ${dto.title}`,
    );
    return saved;
  }

  async getNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    notification.read = true;
    await this.notificationRepo.save(notification);
    this.logger.log(
      `[markAsRead] Notificación ${notificationId} marcada como leída`,
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, read: false }, { read: true });
    this.logger.log(
      `[markAllAsRead] Todas las notificaciones de ${userId} marcadas como leídas`,
    );
  }

  async deleteOldNotifications(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('read = :read', { read: true })
      .execute();

    this.logger.log(
      `[deleteOldNotifications] Eliminadas ${result.affected} notificaciones antiguas`,
    );
    return result.affected || 0;
  }

  // Métodos helper para crear notificaciones específicas
  async notifyPaymentConfirmed(
    userId: string,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.SUCCESS,
      title: 'Pago confirmado',
      message: `Tu pago de S/. ${amount.toFixed(2)} ha sido procesado exitosamente`,
      link: '/dashboard/payments',
      userId,
    });
  }

  async notifyPaymentRejected(
    userId: string,
    reason: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.ERROR,
      title: 'Pago rechazado',
      message: `Tu pago fue rechazado: ${reason}`,
      link: '/dashboard/payments',
      userId,
    });
  }

  async notifyEventPublished(
    userId: string,
    eventTitle: string,
    eventId: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.INFO,
      title: 'Nuevo evento publicado',
      message: `El evento "${eventTitle}" ya está disponible para inscripciones`,
      link: `/dashboard/events/${eventId}`,
      userId,
    });
  }

  async notifyUpcomingEvent(
    userId: string,
    eventTitle: string,
    eventId: string,
    daysUntil: number,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.WARNING,
      title: 'Evento próximo',
      message: `El evento "${eventTitle}" comienza en ${daysUntil} día${daysUntil > 1 ? 's' : ''}`,
      link: `/dashboard/events/${eventId}`,
      userId,
    });
  }
}
