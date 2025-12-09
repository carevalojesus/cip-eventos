import { Body, Controller, Get, Param, Post, UseGuards, Logger } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { SendSmsDto, SendSmsTemplateDto } from './dto/send-sms.dto';
import { SendWhatsAppDto, SendWhatsAppTemplateDto } from './dto/send-whatsapp.dto';
import { MessageResult, DeliveryStatus } from './interfaces/messaging-provider.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('messaging')
export class MessagingController {
  private readonly logger = new Logger(MessagingController.name);

  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Webhook para recibir status updates de Twilio
   * Este endpoint recibe notificaciones de Twilio cuando cambia el estado de un mensaje
   */
  @Post('webhook/twilio')
  async twilioWebhook(@Body() body: any): Promise<string> {
    this.logger.log('Twilio webhook received', JSON.stringify(body, null, 2));

    const {
      MessageSid,
      MessageStatus,
      From,
      To,
      ErrorCode,
      ErrorMessage,
    } = body;

    // Aquí podrías actualizar la base de datos con el estado del mensaje
    // Por ejemplo, actualizar una tabla notification_logs
    this.logger.log(
      `Message ${MessageSid} status: ${MessageStatus} from ${From} to ${To}`,
    );

    if (ErrorCode) {
      this.logger.error(
        `Message ${MessageSid} error: ${ErrorCode} - ${ErrorMessage}`,
      );
    }

    // Twilio espera una respuesta TwiML vacía
    return '<Response></Response>';
  }

  /**
   * Endpoints de testing (solo para administradores)
   */

  @Post('test/sms')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async testSms(@Body() dto: SendSmsDto): Promise<MessageResult> {
    this.logger.log(`Testing SMS to ${dto.to}`);
    return this.messagingService.sendSms(dto.to, dto.message);
  }

  @Post('test/sms/template')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async testSmsTemplate(@Body() dto: SendSmsTemplateDto): Promise<MessageResult> {
    this.logger.log(`Testing SMS template ${dto.templateId} to ${dto.to}`);
    return this.messagingService.sendSmsTemplate(
      dto.to,
      dto.templateId,
      dto.variables || {},
    );
  }

  @Post('test/whatsapp')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async testWhatsApp(@Body() dto: SendWhatsAppDto): Promise<MessageResult> {
    this.logger.log(`Testing WhatsApp to ${dto.to}`);
    return this.messagingService.sendWhatsApp(dto.to, dto.message);
  }

  @Post('test/whatsapp/template')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async testWhatsAppTemplate(@Body() dto: SendWhatsAppTemplateDto): Promise<MessageResult> {
    this.logger.log(`Testing WhatsApp template ${dto.templateId} to ${dto.to}`);
    return this.messagingService.sendWhatsAppTemplate(
      dto.to,
      dto.templateId,
      dto.variables || {},
    );
  }

  @Get('status/sms/:messageId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getSmsStatus(@Param('messageId') messageId: string): Promise<{ status: DeliveryStatus }> {
    const status = await this.messagingService.getSmsDeliveryStatus(messageId);
    return { status };
  }

  @Get('status/whatsapp/:messageId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getWhatsAppStatus(@Param('messageId') messageId: string): Promise<{ status: DeliveryStatus }> {
    const status = await this.messagingService.getWhatsAppDeliveryStatus(messageId);
    return { status };
  }
}
