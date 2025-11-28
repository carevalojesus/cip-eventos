import { Injectable } from '@nestjs/common';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
}

@Injectable()
export class NotificationsService {
  // TODO: Replace with database queries in the future
  async getNotifications(userId: string): Promise<Notification[]> {
    // Mock notifications - in production, fetch from database
    return [
      {
        id: '1',
        type: 'info',
        title: 'Nuevo evento publicado',
        message: 'El evento "Congreso Nacional de Ingeniería" ya está disponible para inscripciones',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        link: '/dashboard/events/1'
      },
      {
        id: '2',
        type: 'success',
        title: 'Pago confirmado',
        message: 'Tu pago de S/. 150.00 ha sido procesado exitosamente',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        link: '/dashboard/payments'
      },
      {
        id: '3',
        type: 'warning',
        title: 'Evento próximo',
        message: 'El evento "Taller de IA" comienza en 2 días',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        link: '/dashboard/events/2'
      },
    ];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId);
    return notifications.filter(n => !n.read).length;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    // TODO: Update database
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);
  }

  async markAllAsRead(userId: string): Promise<void> {
    // TODO: Update database
    console.log(`Marking all notifications as read for user ${userId}`);
  }
}
