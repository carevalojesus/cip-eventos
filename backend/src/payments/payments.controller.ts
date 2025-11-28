import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportPaymentDto } from './dto/report-payment.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';
import { CapturePaymentDto } from './dto/capture-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';

@Controller('payments')
@Throttle({ short: { limit: 10, ttl: 60000 } }) // Rate limit global para pagos: 10 por minuto
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
}
