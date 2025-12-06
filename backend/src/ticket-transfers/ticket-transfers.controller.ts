import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TicketTransfersService } from './ticket-transfers.service';
import { InitiateTransferDto } from './dto/initiate-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('ticket-transfers')
export class TicketTransfersController {
  constructor(
    private readonly ticketTransfersService: TicketTransfersService,
  ) {}

  /**
   * POST /ticket-transfers/registrations/:id/transfer
   * Inicia una transferencia de ticket
   * Puede ser llamado por usuarios autenticados o invitados
   */
  @Post('registrations/:id/transfer')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async initiateTransfer(
    @Param('id', ParseUUIDPipe) registrationId: string,
    @Body() dto: InitiateTransferDto,
    @CurrentUser() user?: User,
  ) {
    return await this.ticketTransfersService.initiateTransfer(
      registrationId,
      dto,
      user,
      dto.reason,
    );
  }

  /**
   * POST /ticket-transfers/:id/complete
   * Completa una transferencia pendiente
   * Solo para organizadores y super admins
   */
  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  async completeTransfer(
    @Param('id', ParseUUIDPipe) transferId: string,
    @CurrentUser() user: User,
  ) {
    return await this.ticketTransfersService.completeTransfer(transferId, user);
  }

  /**
   * POST /ticket-transfers/:id/cancel
   * Cancela una transferencia pendiente
   */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelTransfer(
    @Param('id', ParseUUIDPipe) transferId: string,
    @CurrentUser() user: User,
  ) {
    return await this.ticketTransfersService.cancelTransfer(transferId, user);
  }

  /**
   * GET /ticket-transfers/registrations/:id/can-transfer
   * Valida si un ticket puede ser transferido
   * Público para que el frontend pueda mostrar si es posible
   */
  @Get('registrations/:id/can-transfer')
  @Public()
  async canTransfer(@Param('id', ParseUUIDPipe) registrationId: string) {
    return await this.ticketTransfersService.canTransfer(registrationId);
  }

  /**
   * GET /ticket-transfers/registrations/:id/history
   * Obtiene historial de transferencias de un ticket
   */
  @Get('registrations/:id/history')
  @UseGuards(JwtAuthGuard)
  async getTransferHistory(@Param('id', ParseUUIDPipe) registrationId: string) {
    return await this.ticketTransfersService.getTransferHistory(registrationId);
  }
}
