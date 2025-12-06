import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { ReviewRefundDto } from './dto/review-refund.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RefundStatus } from './entities/refund.entity';

@ApiTags('refunds')
@ApiBearerAuth()
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  // ========== USUARIO ==========

  @Post()
  @ApiOperation({ summary: 'Solicitar reembolso (Usuario)' })
  requestRefund(@Body() dto: CreateRefundDto, @CurrentUser() user: User) {
    return this.refundsService.requestRefund(dto, user);
  }

  @Get('my-refunds')
  @ApiOperation({ summary: 'Mis solicitudes de reembolso (Usuario)' })
  getMyRefunds(@CurrentUser() user: User) {
    return this.refundsService.findByUser(user.id);
  }

  // ========== ADMIN ==========

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todas las solicitudes (Admin)' })
  findAll(
    @Query('status') status?: RefundStatus,
    @Query('eventId') eventId?: string,
  ) {
    return this.refundsService.findAll({ status, eventId });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estadísticas de reembolsos (Admin)' })
  getStats(@Query('eventId') eventId?: string) {
    return this.refundsService.getRefundStats(eventId);
  }

  @Get('policies')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar políticas de reembolso (Admin)' })
  getPolicies(@Query('eventId') eventId?: string) {
    return this.refundsService.getPolicies(eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de reembolso' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.refundsService.findOne(id);
  }

  @Post(':id/review')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Revisar solicitud de reembolso (Admin)' })
  reviewRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewRefundDto,
    @CurrentUser() user: User,
  ) {
    return this.refundsService.reviewRefund(id, dto, user);
  }

  @Post(':id/process')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Procesar reembolso aprobado (Admin)' })
  processRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.refundsService.processRefund(id, user);
  }
}
