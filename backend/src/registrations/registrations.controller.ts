import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

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
  @UseGuards(JwtAuthGuard)
  createMember(@Body() dto: CreateRegistrationDto, @CurrentUser() user: User) {
    return this.regService.create(dto, user);
  }
}
