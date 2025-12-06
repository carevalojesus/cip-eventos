import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CheckInDto, CheckOutDto } from './dto/check-in.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { EmailVerifiedGuard } from 'src/auth/guards/email-verified.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly regService: RegistrationsService) {}

  // 🔓 Endpoint Público (Guests)
  // Rate limiting más estricto: 5 registros por minuto por IP
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  createGuest(@Body() dto: CreateRegistrationDto) {
    return this.regService.create(dto, null);
  }

  // 🔒 Endpoint Miembros (Usuarios Logueados)
  // Rate limiting más permisivo para usuarios autenticados: 15 por minuto
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('member')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  createMember(@Body() dto: CreateRegistrationDto, @CurrentUser() user: User) {
    return this.regService.create(dto, user);
  }

  // 🚪 Endpoint Check-In (Staff/Admin) - LEGACY
  @Post('check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  checkIn(@Body('ticketCode') ticketCode: string) {
    return this.regService.checkIn(ticketCode);
  }

  // ============================================
  // 🎟️ NUEVOS ENDPOINTS DE CHECK-IN POR QR
  // ============================================

  /**
   * Check-in avanzado con soporte para sesiones
   * Permite check-in general al evento o a una sesión específica
   *
   * POST /registrations/qr/check-in
   * Body: { ticketCode, sessionId?, mode? }
   */
  @Post('qr/check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'ORGANIZER')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 check-ins por minuto
  checkInQr(@Body() dto: CheckInDto, @CurrentUser() user: User) {
    return this.regService.checkInAdvanced(dto, user);
  }

  /**
   * Check-out de una sesión (modo avanzado)
   * Registra la salida y calcula tiempo de asistencia
   *
   * POST /registrations/qr/check-out
   * Body: { ticketCode, sessionId }
   */
  @Post('qr/check-out')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'ORGANIZER')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  checkOutQr(@Body() dto: CheckOutDto, @CurrentUser() user: User) {
    return this.regService.checkOutSession(dto, user);
  }

  /**
   * Obtener estado de check-in de un ticket
   * Muestra historial completo de asistencia
   *
   * GET /registrations/qr/:ticketCode/status
   */
  @Get('qr/:ticketCode/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'ORGANIZER')
  getTicketStatus(@Param('ticketCode') ticketCode: string) {
    return this.regService.getCheckInStatus(ticketCode);
  }

  /**
   * Validar ticket sin registrar check-in
   * Útil para pre-validación antes del escaneo
   *
   * GET /registrations/qr/:ticketCode/validate
   */
  @Get('qr/:ticketCode/validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'ORGANIZER')
  async validateTicketQr(@Param('ticketCode') ticketCode: string) {
    const registration = await this.regService.validateTicket(ticketCode);

    return {
      valid: true,
      ticketCode: registration.ticketCode,
      attendee: {
        firstName: registration.attendee.firstName,
        lastName: registration.attendee.lastName,
        email: registration.attendee.email,
        documentNumber: registration.attendee.documentNumber,
      },
      event: {
        id: registration.event.id,
        title: registration.event.title,
      },
      eventTicket: {
        id: registration.eventTicket.id,
        name: registration.eventTicket.name,
      },
      status: registration.status,
      attended: registration.attended,
      attendedAt: registration.attendedAt,
    };
  }
}
