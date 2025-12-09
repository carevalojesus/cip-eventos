import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePaymentAttemptDto } from './dto/create-payment-attempt.dto';
import { PendingOrdersLimitGuard } from '../common/guards/pending-orders-limit.guard';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 pedidos por minuto
  @UseGuards(PendingOrdersLimitGuard)
  async create(@Body() createDto: CreatePurchaseOrderDto, @Req() req: Request) {
    // Extraer metadata de la peticion
    const metadata = {
      clientIp: this.getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    return await this.purchaseOrdersService.create(createDto, metadata);
  }

  private getClientIp(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    const xRealIp = request.headers['x-real-ip'];

    if (xForwardedFor) {
      const ips = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor;
      return ips.split(',')[0].trim();
    }

    if (xRealIp) {
      return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
    }

    return (
      request.ip ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.purchaseOrdersService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    return await this.purchaseOrdersService.cancel(id);
  }

  @Post('payment-attempts')
  @HttpCode(HttpStatus.CREATED)
  async createPaymentAttempt(@Body() createDto: CreatePaymentAttemptDto) {
    return await this.purchaseOrdersService.createPaymentAttempt(createDto);
  }
}
