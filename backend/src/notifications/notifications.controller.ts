import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './services/push-notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  RegisterDeviceTokenDto,
  UnregisterDeviceTokenDto,
} from './dto/register-device-token.dto';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Returns all notifications for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.getNotifications(user.userId);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Returns the number of unread notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(@CurrentUser() user: { userId: string }) {
    const count = await this.notificationsService.getUnreadCount(user.userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Marks a specific notification as read',
  })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @CurrentUser() user: { userId: string },
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.markAsRead(user.userId, notificationId);
    return { message: 'Notification marked as read' };
  }

  @Patch('mark-all-read')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all user notifications as read',
  })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: { userId: string }) {
    await this.notificationsService.markAllAsRead(user.userId);
    return { message: 'All notifications marked as read' };
  }

  // ============ PUSH NOTIFICATIONS - DEVICE TOKENS ============

  @Post('devices')
  @ApiOperation({
    summary: 'Register device token',
    description: 'Registers a device token for push notifications',
  })
  @ApiResponse({ status: 201, description: 'Device token registered' })
  async registerDeviceToken(
    @CurrentUser() user: User,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    const deviceToken = await this.pushNotificationService.registerToken(
      user,
      dto.token,
      dto.platform,
      dto.provider,
      {
        deviceName: dto.deviceName,
        deviceModel: dto.deviceModel,
        osVersion: dto.osVersion,
        appVersion: dto.appVersion,
      },
    );
    return {
      message: 'Device token registered',
      deviceId: deviceToken.id,
    };
  }

  @Delete('devices')
  @ApiOperation({
    summary: 'Unregister device token',
    description: 'Removes a device token from push notifications',
  })
  @ApiResponse({ status: 200, description: 'Device token unregistered' })
  async unregisterDeviceToken(@Body() dto: UnregisterDeviceTokenDto) {
    await this.pushNotificationService.unregisterToken(dto.token);
    return { message: 'Device token unregistered' };
  }

  @Get('devices')
  @ApiOperation({
    summary: 'Get user devices',
    description: 'Returns all registered devices for push notifications',
  })
  @ApiResponse({ status: 200, description: 'Devices retrieved successfully' })
  async getUserDevices(@CurrentUser() user: { userId: string }) {
    return this.pushNotificationService.getUserTokens(user.userId);
  }

  @Delete('devices/all')
  @ApiOperation({
    summary: 'Unregister all devices',
    description: 'Removes all device tokens for the user (logout from all devices)',
  })
  @ApiResponse({ status: 200, description: 'All device tokens unregistered' })
  async unregisterAllDevices(@CurrentUser() user: { userId: string }) {
    await this.pushNotificationService.unregisterAllUserTokens(user.userId);
    return { message: 'All device tokens unregistered' };
  }
}
