import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications', description: 'Returns all notifications for the current user' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.getNotifications(user.userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count', description: 'Returns the number of unread notifications' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@CurrentUser() user: { userId: string }) {
    const count = await this.notificationsService.getUnreadCount(user.userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read', description: 'Marks a specific notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @CurrentUser() user: { userId: string },
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.markAsRead(user.userId, notificationId);
    return { message: 'Notification marked as read' };
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read', description: 'Marks all user notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: { userId: string }) {
    await this.notificationsService.markAllAsRead(user.userId);
    return { message: 'All notifications marked as read' };
  }
}
