import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { DeviceToken } from './entities/device-token.entity';
import { NotificationTriggersService } from './services/notification-triggers.service';
import { NotificationsCronService } from './services/notifications-cron.service';
import { PushNotificationService } from './services/push-notification.service';
import { QueueModule } from '../queue/queue.module';
import { Registration } from '../registrations/entities/registration.entity';
import { Event } from '../events/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationLog,
      DeviceToken,
      Registration,
      Event,
    ]),
    QueueModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationTriggersService,
    NotificationsCronService,
    PushNotificationService,
  ],
  exports: [
    NotificationsService,
    NotificationTriggersService,
    NotificationsCronService,
    PushNotificationService,
  ],
})
export class NotificationsModule {}
