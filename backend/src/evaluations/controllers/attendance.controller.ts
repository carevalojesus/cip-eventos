import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../roles/entities/role.entity';

import { AttendanceService } from '../services/attendance.service';
import {
  RecordAttendanceDto,
  BatchRecordAttendanceDto,
  CheckInDto,
} from '../dto/record-attendance.dto';

@Controller('evaluations/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  recordAttendance(@Body() dto: RecordAttendanceDto) {
    return this.attendanceService.recordAttendance(dto);
  }

  @Post('batch')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  batchRecordAttendance(@Body() dto: BatchRecordAttendanceDto) {
    return this.attendanceService.batchRecordAttendance(dto);
  }

  @Post('check-in')
  checkIn(@Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(dto);
  }

  @Post('check-out')
  checkOut(
    @Body() body: { sessionId: string; ticketCode: string },
  ) {
    return this.attendanceService.checkOut(body.sessionId, body.ticketCode);
  }

  @Post('virtual-connection')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  recordVirtualConnection(
    @Body()
    body: {
      sessionId: string;
      enrollmentId: string;
      platform?: string;
      joinedAt?: string;
      leftAt?: string;
      ipAddress?: string;
    },
  ) {
    return this.attendanceService.recordVirtualConnection(
      body.sessionId,
      body.enrollmentId,
      {
        platform: body.platform,
        joinedAt: body.joinedAt ? new Date(body.joinedAt) : undefined,
        leftAt: body.leftAt ? new Date(body.leftAt) : undefined,
        ipAddress: body.ipAddress,
      },
    );
  }

  @Get('session/:sessionId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getBySession(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.attendanceService.getAttendanceBySession(sessionId);
  }

  @Get('enrollment/:enrollmentId')
  getByEnrollment(@Param('enrollmentId', ParseUUIDPipe) enrollmentId: string) {
    return this.attendanceService.getAttendanceByEnrollment(enrollmentId);
  }

  @Get('block/:blockId/report')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getBlockReport(@Param('blockId', ParseUUIDPipe) blockId: string) {
    return this.attendanceService.getBlockAttendanceReport(blockId);
  }
}
