import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { ChargebackService } from './services/chargeback.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportPaymentDto } from './dto/report-payment.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';
import { CapturePaymentDto } from './dto/capture-payment.dto';
import { ProcessChargebackDto } from './dto/process-chargeback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import { PaymentStatus } from './entities/payment.entity';
import { RateLimitConfig } from '../common/config/rate-limit.config';

@Controller('payments')
@Throttle({
  default: {
    limit: RateLimitConfig.THROTTLE_LIMIT,
    ttl: RateLimitConfig.THROTTLE_TTL
  }
}) // Rate limit global para pagos configurado via env
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly chargebackService: ChargebackService,
  ) {}

  @Patch(':id/report')
  @UseGuards(JwtAuthGuard)
  reportPayment(
    @Param('id') paymentId: string,
    @Body() dto: ReportPaymentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.paymentsService.reportPayment(paymentId, dto, user.userId);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard) // RolesGuard es vital aquí
  @Roles('SUPER_ADMIN', 'TESORERO') // Solo personal autorizado
  reviewPayment(
    @Param('id') paymentId: string,
    @Body() dto: ReviewPaymentDto,
    @CurrentUser() adminUser: User,
  ) {
    return this.paymentsService.reviewPayment(paymentId, dto, adminUser);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.paymentsService.createPaymentIntent(
      createPaymentDto,
      user.userId,
    );
  }

  @Post('paypal/capture')
  @UseGuards(JwtAuthGuard)
  async capturePayment(
    @Body() dto: CapturePaymentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.paymentsService.completePaypalPayment(
      dto.paymentId,
      dto.orderId,
      user.userId,
    );
  }

  // ============ CONTRACARGOS (CHARGEBACKS) ============

  @Post('chargeback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_FINANZAS')
  async processChargeback(
    @Body() dto: ProcessChargebackDto,
    @CurrentUser() user: User,
  ) {
    return this.chargebackService.processChargeback(dto, user);
  }

  @Get('chargebacks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_FINANZAS')
  async getChargebacks(@Query('status') status?: PaymentStatus) {
    return this.chargebackService.getChargebacksByStatus(status);
  }
}
