import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  /**
   * POST /waitlist - Unirse a lista de espera
   * Rate limited para evitar abuse
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests por minuto
  async join(@Body() dto: JoinWaitlistDto, @Request() req) {
    const entry = await this.waitlistService.join(
      dto.ticketId,
      dto.personId,
      dto.email,
    );

    return {
      message: 'Te has unido a la lista de espera exitosamente',
      waitlistId: entry.id,
      position: entry.priority,
      status: entry.status,
    };
  }

  /**
   * DELETE /waitlist/:ticketId - Salirse de la lista de espera
   */
  @Delete(':ticketId')
  @UseGuards(JwtAuthGuard)
  async leave(@Param('ticketId') ticketId: string, @Request() req) {
    // TODO: Obtener personId del usuario autenticado
    // Por ahora asumimos que viene en el body o se puede obtener del req.user
    const personId = req.user?.personId; // Ajustar según la estructura de auth

    await this.waitlistService.leave(ticketId, personId);

    return {
      message: 'Te has salido de la lista de espera',
    };
  }

  /**
   * GET /waitlist/:ticketId/position - Ver mi posición en la lista
   */
  @Get(':ticketId/position')
  @UseGuards(JwtAuthGuard)
  async getPosition(@Param('ticketId') ticketId: string, @Request() req) {
    // TODO: Obtener personId del usuario autenticado
    const personId = req.user?.personId;

    const position = await this.waitlistService.getPosition(
      ticketId,
      personId,
    );

    return position;
  }

  /**
   * GET /waitlist/:ticketId/count - Ver cuántos hay en espera (público)
   */
  @Get(':ticketId/count')
  @Public()
  async getCount(@Param('ticketId') ticketId: string) {
    const count = await this.waitlistService.getWaitlistCount(ticketId);

    return {
      ticketId,
      waitlistCount: count,
    };
  }

  /**
   * POST /waitlist/validate-token/:token - Validar token de compra
   * Este endpoint es público porque se accede desde el link del email
   */
  @Post('validate-token/:token')
  @Public()
  async validateToken(@Param('token') token: string) {
    const entry = await this.waitlistService.validateToken(token);

    return {
      valid: true,
      ticketId: entry.eventTicket.id,
      ticketName: entry.eventTicket.name,
      personId: entry.person.id,
      expiresAt: entry.invitationExpiresAt,
      email: entry.email,
    };
  }
}
