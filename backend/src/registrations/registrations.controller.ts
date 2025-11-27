import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
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

  // 🚪 Endpoint Check-In (Staff/Admin)
  @Post('check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  checkIn(@Body('ticketCode') ticketCode: string) {
    return this.regService.checkIn(ticketCode);
  }
}
