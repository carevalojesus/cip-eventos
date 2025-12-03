import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';

@ApiTags('dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard) // Protect all dashboard routes with auth and email verification
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Returns key metrics including active events, registrations, income, and tickets sold with trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Email not verified' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('upcoming-events')
  @ApiOperation({
    summary: 'Get upcoming events',
    description: 'Returns a list of upcoming published events',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of events to return',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming events retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUpcomingEvents(@Query('limit') limit: number = 5) {
    return this.dashboardService.getUpcomingEvents(limit);
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Get recent activity',
    description:
      'Returns recent system activity including registrations and payments',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of activities to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecentActivity(@Query('limit') limit: number = 10) {
    return this.dashboardService.getRecentActivity(limit);
  }
}
