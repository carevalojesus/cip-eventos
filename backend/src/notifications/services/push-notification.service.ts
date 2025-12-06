import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  DeviceToken,
  DevicePlatform,
  TokenProvider,
} from '../entities/device-token.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationLog } from '../entities/notification-log.entity';
import {
  NotificationChannel,
  NotificationStatus,
} from '../enums/notification-status.enum';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  action?: {
    type: 'OPEN_URL' | 'OPEN_SCREEN' | 'NONE';
    value?: string;
  };
}

export interface SendPushResult {
  success: boolean;
  tokenId: string;
  error?: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepository: Repository<DeviceToken>,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
  ) {}

  async registerToken(
    user: User,
    token: string,
    platform: DevicePlatform,
    provider: TokenProvider = TokenProvider.FCM,
    deviceInfo?: {
      deviceName?: string;
      deviceModel?: string;
      osVersion?: string;
      appVersion?: string;
    },
  ): Promise<DeviceToken> {
    let deviceToken = await this.deviceTokenRepository.findOne({
      where: { token },
    });

    if (deviceToken) {
      deviceToken.user = user;
      deviceToken.platform = platform;
      deviceToken.provider = provider;
      deviceToken.isActive = true;
      deviceToken.lastUsedAt = new Date();
      if (deviceInfo) {
        deviceToken.deviceName = deviceInfo.deviceName || deviceToken.deviceName;
        deviceToken.deviceModel = deviceInfo.deviceModel || deviceToken.deviceModel;
        deviceToken.osVersion = deviceInfo.osVersion || deviceToken.osVersion;
        deviceToken.appVersion = deviceInfo.appVersion || deviceToken.appVersion;
      }
    } else {
      deviceToken = this.deviceTokenRepository.create({
        user,
        token,
        platform,
        provider,
        isActive: true,
        lastUsedAt: new Date(),
        ...deviceInfo,
      });
    }

    return this.deviceTokenRepository.save(deviceToken);
  }

  async unregisterToken(token: string): Promise<void> {
    await this.deviceTokenRepository.update({ token }, { isActive: false });
  }

  async unregisterAllUserTokens(userId: string): Promise<void> {
    await this.deviceTokenRepository.update(
      { user: { id: userId } },
      { isActive: false },
    );
  }

  async getUserTokens(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenRepository.find({
      where: { user: { id: userId }, isActive: true },
    });
  }

  async sendToUser(
    userId: string,
    payload: PushPayload,
    entityType?: string,
    entityId?: string,
  ): Promise<SendPushResult[]> {
    const tokens = await this.getUserTokens(userId);

    if (tokens.length === 0) {
      this.logger.debug(`No active tokens found for user ${userId}`);
      return [];
    }

    const results: SendPushResult[] = [];

    for (const deviceToken of tokens) {
      const result = await this.sendToToken(deviceToken, payload);
      results.push(result);

      await this.logNotification(
        deviceToken,
        payload,
        result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        result.error,
        entityType,
        entityId,
      );
    }

    return results;
  }

  async sendToUsers(
    userIds: string[],
    payload: PushPayload,
    entityType?: string,
    entityId?: string,
  ): Promise<Map<string, SendPushResult[]>> {
    const tokens = await this.deviceTokenRepository.find({
      where: { user: { id: In(userIds) }, isActive: true },
      relations: ['user'],
    });

    const resultsByUser = new Map<string, SendPushResult[]>();

    for (const token of tokens) {
      const userId = token.user.id;
      const result = await this.sendToToken(token, payload);

      if (!resultsByUser.has(userId)) {
        resultsByUser.set(userId, []);
      }
      resultsByUser.get(userId)!.push(result);

      await this.logNotification(
        token,
        payload,
        result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        result.error,
        entityType,
        entityId,
      );
    }

    return resultsByUser;
  }

  private async sendToToken(
    deviceToken: DeviceToken,
    payload: PushPayload,
  ): Promise<SendPushResult> {
    try {
      switch (deviceToken.provider) {
        case TokenProvider.FCM:
          return await this.sendViaFCM(deviceToken, payload);
        case TokenProvider.APNS:
          return await this.sendViaAPNS(deviceToken, payload);
        case TokenProvider.WEB_PUSH:
          return await this.sendViaWebPush(deviceToken, payload);
        default:
          return {
            success: false,
            tokenId: deviceToken.id,
            error: `Provider ${deviceToken.provider} not supported`,
          };
      }
    } catch (error) {
      this.logger.error(
        `Error sending push to token ${deviceToken.id}: ${error.message}`,
      );
      return {
        success: false,
        tokenId: deviceToken.id,
        error: error.message,
      };
    }
  }

  private async sendViaFCM(
    deviceToken: DeviceToken,
    payload: PushPayload,
  ): Promise<SendPushResult> {
    // TODO: Implementar integración con Firebase Cloud Messaging
    // Esta es una implementación placeholder que se debe completar
    // con la configuración real de FCM

    this.logger.debug(
      `[FCM] Would send to ${deviceToken.token}: ${payload.title}`,
    );

    // Placeholder: Simular éxito en desarrollo
    if (process.env.NODE_ENV === 'development') {
      return { success: true, tokenId: deviceToken.id };
    }

    // En producción, retornar error hasta que se configure FCM
    return {
      success: false,
      tokenId: deviceToken.id,
      error: 'FCM not configured. Set FIREBASE_* environment variables.',
    };
  }

  private async sendViaAPNS(
    deviceToken: DeviceToken,
    payload: PushPayload,
  ): Promise<SendPushResult> {
    // TODO: Implementar integración con Apple Push Notification Service
    this.logger.debug(
      `[APNS] Would send to ${deviceToken.token}: ${payload.title}`,
    );

    return {
      success: false,
      tokenId: deviceToken.id,
      error: 'APNS not configured',
    };
  }

  private async sendViaWebPush(
    deviceToken: DeviceToken,
    payload: PushPayload,
  ): Promise<SendPushResult> {
    // TODO: Implementar Web Push API
    this.logger.debug(
      `[WebPush] Would send to ${deviceToken.token}: ${payload.title}`,
    );

    return {
      success: false,
      tokenId: deviceToken.id,
      error: 'Web Push not configured',
    };
  }

  private async logNotification(
    deviceToken: DeviceToken,
    payload: PushPayload,
    status: NotificationStatus,
    errorMessage?: string,
    entityType?: string,
    entityId?: string,
  ): Promise<void> {
    const log = this.notificationLogRepository.create({
      type: 'PUSH_NOTIFICATION',
      channel: NotificationChannel.PUSH,
      recipientEmail: deviceToken.user?.email || 'unknown',
      recipientUser: deviceToken.user,
      recipientUserId: deviceToken.user?.id,
      entityType: entityType || 'DeviceToken',
      entityId: entityId || deviceToken.id,
      status,
      errorMessage,
      metadata: {
        title: payload.title,
        body: payload.body,
        platform: deviceToken.platform,
        provider: deviceToken.provider,
        data: payload.data,
      },
      sentAt: status === NotificationStatus.SENT ? new Date() : null,
    });

    await this.notificationLogRepository.save(log);
  }
}
