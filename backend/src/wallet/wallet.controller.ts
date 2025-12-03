import {
  Controller,
  Get,
  Param,
  Res,
  Logger,
  NotFoundException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { WalletService } from './wallet.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { Public } from '../auth/decorators/public.decorator';
import { validate as isUUID } from 'uuid';

@Controller('wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly registrationsService: RegistrationsService,
  ) {}

  /**
   * Genera y redirige al link de Google Wallet para una inscripción
   * Endpoint público pero protegido por token firmado
   */
  @Public()
  @Get(':registrationId')
  async getGoogleWalletLink(
    @Param('registrationId') id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    this.logger.log(`Wallet link requested for registration: ${id}`);

    try {
      // Validar formato UUID
      if (!isUUID(id)) {
        this.logger.warn(`Invalid UUID format for registration: ${id}`);
        throw new BadRequestException('Invalid registration ID format');
      }

      // Validar token firmado
      if (!token) {
        throw new BadRequestException('Missing security token');
      }
      this.walletService.verifySignedToken(token, id);

      // 1. Buscar la inscripción completa con relaciones
      const registration = await this.registrationsService.findOne(id);

      if (!registration) {
        this.logger.warn(`Registration not found: ${id}`);
        throw new NotFoundException('Registration not found');
      }

      // 2. Generar el link de Google Wallet
      const saveUrl = await this.walletService.createWalletLink(registration);

      this.logger.log(`Redirecting to Google Wallet for registration: ${id}`);

      // 3. Redirigir al usuario directo a Google Wallet
      return res.redirect(saveUrl);
    } catch (error) {
      this.logger.error(
        `Failed to generate wallet link for registration ${id}: ${error.message}`,
        error.stack,
      );

      // Manejar diferentes tipos de errores
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        return res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message,
          error: error.name,
        });
      }

      // Error genérico del servidor
      return res.status(500).json({
        statusCode: 500,
        message: 'Failed to generate Google Wallet link',
        error: 'Internal Server Error',
      });
    }
  }
}
