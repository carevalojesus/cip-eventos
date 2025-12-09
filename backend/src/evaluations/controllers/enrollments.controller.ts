import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../roles/entities/role.entity';

import { EnrollmentsService } from '../services/enrollments.service';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';

@Controller('evaluations/enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  enroll(@Request() req: any, @Body() dto: CreateEnrollmentDto) {
    // El attendeeId se obtiene del usuario autenticado
    const attendeeId = req.user.attendeeId;
    return this.enrollmentsService.enroll(attendeeId, dto);
  }

  @Post('admin')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  enrollByAdmin(
    @Body() body: CreateEnrollmentDto & { attendeeId: string },
  ) {
    const { attendeeId, ...dto } = body;
    return this.enrollmentsService.enroll(attendeeId, dto);
  }

  @Get('my-enrollments')
  getMyEnrollments(@Request() req: any) {
    return this.enrollmentsService.findByAttendee(req.user.attendeeId);
  }

  @Get('by-block/:blockId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getByBlock(@Param('blockId', ParseUUIDPipe) blockId: string) {
    return this.enrollmentsService.findByBlock(blockId);
  }

  @Get('by-attendee/:attendeeId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getByAttendee(@Param('attendeeId', ParseUUIDPipe) attendeeId: string) {
    return this.enrollmentsService.findByAttendee(attendeeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Put(':id/confirm-payment')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  confirmPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentsService.confirmPayment(id);
  }

  @Put(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.enrollmentsService.cancel(id, reason);
  }

  @Put(':id/withdraw')
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.enrollmentsService.withdraw(id, reason);
  }

  @Put(':id/finalize')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  finalize(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentsService.finalizeEnrollment(id);
  }

  @Put('block/:blockId/start')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  startBlock(@Param('blockId', ParseUUIDPipe) blockId: string) {
    return this.enrollmentsService.startBlock(blockId);
  }
}
