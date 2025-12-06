import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ConsentService } from '../services/consent.service';
import {
  RecordConsentDto,
  RevokeConsentDto,
  ConsentHistoryQueryDto,
  BulkRecordConsentDto,
} from '../dto/consent.dto';
import { ConsentType } from '../enums/consent-type.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { I18nService, I18nContext } from 'nestjs-i18n';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
    role: string;
  };
  ip?: string;
  headers: {
    'user-agent'?: string;
  };
}

@ApiTags('consent')
@Controller('consent')
export class ConsentController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly i18n: I18nService,
  ) {}

  @Public()
  @Post('accept')
  @ApiOperation({
    summary: 'Registrar aceptación de consentimiento',
    description:
      'Registra que un usuario ha aceptado un tipo específico de consentimiento (términos, privacidad, etc.)',
  })
  @ApiResponse({
    status: 201,
    description: 'Consentimiento registrado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o falta personId/userId',
  })
  async acceptConsent(
    @Body() dto: RecordConsentDto,
    @Req() req: RequestWithUser,
  ) {
    // Agregar IP y User-Agent automáticamente si no vienen en el DTO
    if (!dto.ipAddress) {
      dto.ipAddress = req.ip;
    }
    if (!dto.userAgent) {
      dto.userAgent = req.headers['user-agent'];
    }

    const consent = await this.consentService.recordConsent(dto);

    return {
      message: this.i18n.t('consent.recorded_successfully', {
        lang: I18nContext.current()?.lang,
      }),
      consent: {
        id: consent.id,
        consentType: consent.consentType,
        documentVersion: consent.documentVersion,
        acceptedAt: consent.acceptedAt,
      },
    };
  }

  @Public()
  @Post('accept-bulk')
  @ApiOperation({
    summary: 'Registrar múltiples consentimientos a la vez',
    description:
      'Útil para el proceso de registro donde se aceptan múltiples términos',
  })
  @ApiResponse({
    status: 201,
    description: 'Consentimientos registrados exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  async acceptBulkConsents(
    @Body() dto: BulkRecordConsentDto,
    @Req() req: RequestWithUser,
  ) {
    const ipAddress = dto.ipAddress || req.ip;
    const userAgent = dto.userAgent || req.headers['user-agent'];

    const consents = await this.consentService.recordBulkConsents(
      dto.personId,
      dto.userId,
      dto.consents,
      ipAddress,
      userAgent,
    );

    return {
      message: this.i18n.t('consent.bulk_recorded_successfully', {
        lang: I18nContext.current()?.lang,
        args: { count: consents.length },
      }),
      count: consents.length,
      consents: consents.map((c) => ({
        id: c.id,
        consentType: c.consentType,
        documentVersion: c.documentVersion,
        acceptedAt: c.acceptedAt,
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('revoke')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revocar un consentimiento',
    description: 'Permite revocar un consentimiento previamente otorgado',
  })
  @ApiResponse({
    status: 200,
    description: 'Consentimiento revocado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Consentimiento no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Consentimiento ya fue revocado',
  })
  async revokeConsent(
    @Body() dto: RevokeConsentDto,
    @Req() req: RequestWithUser,
  ) {
    const consent = await this.consentService.revokeConsent(
      dto,
      req.user.userId,
    );

    return {
      message: this.i18n.t('consent.revoked_successfully', {
        lang: I18nContext.current()?.lang,
      }),
      consent: {
        id: consent.id,
        consentType: consent.consentType,
        revokedAt: consent.revokedAt,
        revokeReason: consent.revokeReason,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener historial de consentimientos',
    description:
      'Retorna el historial completo de consentimientos de un usuario o persona',
  })
  @ApiQuery({
    name: 'personId',
    required: false,
    description: 'ID de la persona',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario' })
  @ApiQuery({
    name: 'consentType',
    required: false,
    enum: ConsentType,
    description: 'Filtrar por tipo de consentimiento',
  })
  @ApiQuery({
    name: 'includeRevoked',
    required: false,
    type: Boolean,
    description: 'Incluir consentimientos revocados',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de consentimientos',
  })
  @ApiResponse({
    status: 400,
    description: 'Se requiere personId o userId',
  })
  async getHistory(@Query() query: ConsentHistoryQueryDto) {
    const history = await this.consentService.getConsentHistory(query);

    return {
      count: history.length,
      consents: history.map((c) => ({
        id: c.id,
        consentType: c.consentType,
        documentVersion: c.documentVersion,
        acceptedAt: c.acceptedAt,
        revokedAt: c.revokedAt,
        revokeReason: c.revokeReason,
        ipAddress: c.ipAddress,
        userAgent: c.userAgent,
        metadata: c.metadata,
      })),
    };
  }

  @Public()
  @Get('status/:consentType')
  @ApiOperation({
    summary: 'Verificar estado de un consentimiento',
    description:
      'Verifica si un usuario tiene un consentimiento válido y actualizado',
  })
  @ApiQuery({
    name: 'personId',
    required: false,
    description: 'ID de la persona',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Estado del consentimiento',
  })
  @ApiResponse({
    status: 400,
    description: 'Se requiere personId o userId',
  })
  async getConsentStatus(
    @Param('consentType') consentType: ConsentType,
    @Query('personId') personId?: string,
    @Query('userId') userId?: string,
  ) {
    if (!personId && !userId) {
      throw new BadRequestException(
        this.i18n.t('consent.person_or_user_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const status = await this.consentService.getConsentStatus(
      personId,
      userId,
      consentType,
    );

    return status;
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-consents')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener mis consentimientos activos',
    description:
      'Retorna todos los consentimientos activos del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de consentimientos activos',
  })
  async getMyConsents(@Req() req: RequestWithUser) {
    const consents = await this.consentService.getActiveConsents(
      undefined,
      req.user.userId,
    );

    return {
      count: consents.length,
      consents: consents.map((c) => ({
        id: c.id,
        consentType: c.consentType,
        documentVersion: c.documentVersion,
        acceptedAt: c.acceptedAt,
        currentVersion:
          this.consentService.getCurrentDocumentVersion(c.consentType),
        needsUpdate:
          c.documentVersion !==
          this.consentService.getCurrentDocumentVersion(c.consentType),
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate-required')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Validar consentimientos requeridos',
    description:
      'Verifica que el usuario tenga todos los consentimientos obligatorios',
  })
  @ApiQuery({
    name: 'personId',
    required: false,
    description: 'ID de la persona',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la validación',
  })
  async validateRequired(
    @Query('personId') personId?: string,
    @Query('userId') userId?: string,
  ) {
    if (!personId && !userId) {
      throw new BadRequestException(
        this.i18n.t('consent.person_or_user_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const validation = await this.consentService.validateRequiredConsents(
      personId,
      userId,
    );

    return {
      valid: validation.valid,
      missing: validation.missing,
      message: validation.valid
        ? this.i18n.t('consent.all_required_present', {
            lang: I18nContext.current()?.lang,
          })
        : this.i18n.t('consent.missing_required', {
            lang: I18nContext.current()?.lang,
            args: { count: validation.missing.length },
          }),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('revoke-all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revocar todos los consentimientos',
    description:
      'Revoca todos los consentimientos activos de un usuario (útil para eliminación de cuenta)',
  })
  @ApiQuery({
    name: 'personId',
    required: false,
    description: 'ID de la persona',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario' })
  @ApiQuery({
    name: 'reason',
    required: false,
    description: 'Razón de la revocación masiva',
  })
  @ApiResponse({
    status: 200,
    description: 'Consentimientos revocados exitosamente',
  })
  async revokeAll(
    @Query('personId') personId?: string,
    @Query('userId') userId?: string,
    @Query('reason') reason?: string,
    @Req() req?: RequestWithUser,
  ) {
    if (!personId && !userId) {
      throw new BadRequestException(
        this.i18n.t('consent.person_or_user_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const count = await this.consentService.revokeAllConsents(
      personId,
      userId,
      reason,
      req?.user?.userId,
    );

    return {
      message: this.i18n.t('consent.bulk_revoked_successfully', {
        lang: I18nContext.current()?.lang,
        args: { count },
      }),
      count,
    };
  }

  @Public()
  @Get('versions')
  @ApiOperation({
    summary: 'Obtener versiones actuales de documentos',
    description:
      'Retorna las versiones actuales de todos los tipos de consentimiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Versiones de documentos',
  })
  async getDocumentVersions() {
    const versions: Record<ConsentType, string> = {
      [ConsentType.TERMS_AND_CONDITIONS]:
        this.consentService.getCurrentDocumentVersion(
          ConsentType.TERMS_AND_CONDITIONS,
        ),
      [ConsentType.PRIVACY_POLICY]:
        this.consentService.getCurrentDocumentVersion(
          ConsentType.PRIVACY_POLICY,
        ),
      [ConsentType.MARKETING]:
        this.consentService.getCurrentDocumentVersion(ConsentType.MARKETING),
      [ConsentType.DATA_PROCESSING]:
        this.consentService.getCurrentDocumentVersion(
          ConsentType.DATA_PROCESSING,
        ),
    };

    return {
      versions,
    };
  }
}
