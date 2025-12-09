import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { ConsentLog } from '../entities/consent-log.entity';
import { ConsentType } from '../enums/consent-type.enum';
import {
  RecordConsentDto,
  RevokeConsentDto,
  ConsentStatusDto,
  ConsentHistoryQueryDto,
} from '../dto/consent.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  // Versiones actuales de documentos - pueden moverse a configuración o BD
  private readonly DOCUMENT_VERSIONS: Record<ConsentType, string> = {
    [ConsentType.TERMS_AND_CONDITIONS]: 'v2.1',
    [ConsentType.PRIVACY_POLICY]: 'v2.0',
    [ConsentType.MARKETING]: 'v1.0',
    [ConsentType.DATA_PROCESSING]: 'v1.5',
  };

  constructor(
    @InjectRepository(ConsentLog)
    private readonly consentLogRepository: Repository<ConsentLog>,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registrar un nuevo consentimiento
   */
  async recordConsent(dto: RecordConsentDto): Promise<ConsentLog> {
    // Validar que al menos personId o userId estén presentes
    if (!dto.personId && !dto.userId) {
      throw new BadRequestException(
        this.i18n.t('consent.person_or_user_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Verificar si ya existe un consentimiento válido del mismo tipo
    const existingConsent = await this.getActiveConsent(
      dto.personId,
      dto.userId,
      dto.consentType,
    );

    if (existingConsent) {
      this.logger.warn(
        `Consent already exists for type ${dto.consentType} - personId: ${dto.personId}, userId: ${dto.userId}`,
      );
      // Opcionalmente, podrías revocar el anterior y crear uno nuevo
      // Para este caso, simplemente retornamos el existente
      return existingConsent;
    }

    const consent = this.consentLogRepository.create({
      person: dto.personId ? { id: dto.personId } : null,
      user: dto.userId ? { id: dto.userId } : null,
      consentType: dto.consentType,
      documentVersion: dto.documentVersion,
      ipAddress: dto.ipAddress || null,
      userAgent: dto.userAgent || null,
      acceptedAt: new Date(),
      metadata: dto.metadata || null,
    });

    const saved = await this.consentLogRepository.save(consent);

    this.logger.log(
      `Consent recorded: ${dto.consentType} v${dto.documentVersion} - personId: ${dto.personId}, userId: ${dto.userId}`,
    );

    return saved;
  }

  /**
   * Registrar múltiples consentimientos de una vez (útil para registro)
   */
  async recordBulkConsents(
    personId: string | undefined,
    userId: string | undefined,
    consents: Array<{
      consentType: ConsentType;
      documentVersion: string;
      metadata?: Record<string, any>;
    }>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ConsentLog[]> {
    if (!personId && !userId) {
      throw new BadRequestException(
        this.i18n.t('consent.person_or_user_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const consentLogs: ConsentLog[] = [];

    for (const consentData of consents) {
      // Verificar si ya existe
      const existing = await this.getActiveConsent(
        personId,
        userId,
        consentData.consentType,
      );

      if (!existing) {
        const consent = this.consentLogRepository.create({
          person: personId ? { id: personId } : null,
          user: userId ? { id: userId } : null,
          consentType: consentData.consentType,
          documentVersion: consentData.documentVersion,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          acceptedAt: new Date(),
          metadata: consentData.metadata || null,
        });

        consentLogs.push(consent);
      }
    }

    if (consentLogs.length > 0) {
      const saved = await this.consentLogRepository.save(consentLogs);
      this.logger.log(
        `Bulk consent recorded: ${saved.length} consents - personId: ${personId}, userId: ${userId}`,
      );
      return saved;
    }

    return [];
  }

  /**
   * Revocar un consentimiento
   */
  async revokeConsent(
    dto: RevokeConsentDto,
    revokedByUserId?: string,
  ): Promise<ConsentLog> {
    const consent = await this.consentLogRepository.findOne({
      where: { id: dto.consentId },
      relations: ['person', 'user'],
    });

    if (!consent) {
      throw new NotFoundException(
        this.i18n.t('consent.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (consent.revokedAt) {
      throw new BadRequestException(
        this.i18n.t('consent.already_revoked', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    consent.revokedAt = new Date();
    consent.revokeReason = dto.reason || null;
    if (revokedByUserId) {
      consent.revokedBy = { id: revokedByUserId } as any;
    }

    const updated = await this.consentLogRepository.save(consent);

    this.logger.log(
      `Consent revoked: ${consent.consentType} (ID: ${consent.id}) - Reason: ${dto.reason}`,
    );

    return updated;
  }

  /**
   * Obtener historial de consentimientos
   */
  async getConsentHistory(
    query: ConsentHistoryQueryDto,
  ): Promise<ConsentLog[]> {
    if (!query.personId && !query.userId) {
      throw new BadRequestException(
        this.i18n.t('consent.person_or_user_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const queryBuilder =
      this.consentLogRepository.createQueryBuilder('consent');

    if (query.personId) {
      queryBuilder.andWhere('consent.personId = :personId', {
        personId: query.personId,
      });
    }

    if (query.userId) {
      queryBuilder.andWhere('consent.userId = :userId', {
        userId: query.userId,
      });
    }

    if (query.consentType) {
      queryBuilder.andWhere('consent.consentType = :consentType', {
        consentType: query.consentType,
      });
    }

    if (query.includeRevoked === false) {
      queryBuilder.andWhere('consent.revokedAt IS NULL');
    }

    queryBuilder
      .leftJoinAndSelect('consent.person', 'person')
      .leftJoinAndSelect('consent.user', 'user')
      .leftJoinAndSelect('consent.revokedBy', 'revokedBy')
      .orderBy('consent.acceptedAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Verificar si el usuario tiene un consentimiento válido
   */
  async hasValidConsent(
    personId: string | undefined,
    userId: string | undefined,
    consentType: ConsentType,
  ): Promise<boolean> {
    const consent = await this.getActiveConsent(personId, userId, consentType);
    return !!consent;
  }

  /**
   * Obtener el consentimiento activo (no revocado)
   */
  async getActiveConsent(
    personId: string | undefined,
    userId: string | undefined,
    consentType: ConsentType,
  ): Promise<ConsentLog | null> {
    if (!personId && !userId) {
      return null;
    }

    const where: any = {
      consentType,
      revokedAt: IsNull(),
    };

    if (personId) {
      where.person = { id: personId };
    }

    if (userId) {
      where.user = { id: userId };
    }

    return await this.consentLogRepository.findOne({
      where,
      order: { acceptedAt: 'DESC' },
    });
  }

  /**
   * Obtener estado de consentimiento
   */
  async getConsentStatus(
    personId: string | undefined,
    userId: string | undefined,
    consentType: ConsentType,
  ): Promise<ConsentStatusDto> {
    const currentVersion = this.getCurrentDocumentVersion(consentType);
    const activeConsent = await this.getActiveConsent(
      personId,
      userId,
      consentType,
    );

    if (!activeConsent) {
      return {
        consentType,
        hasValidConsent: false,
        currentVersion,
        needsUpdate: true,
      };
    }

    const needsUpdate = activeConsent.documentVersion !== currentVersion;

    return {
      consentType,
      hasValidConsent: true,
      currentVersion,
      acceptedVersion: activeConsent.documentVersion,
      acceptedAt: activeConsent.acceptedAt,
      needsUpdate,
    };
  }

  /**
   * Obtener versión actual de un documento
   */
  getCurrentDocumentVersion(consentType: ConsentType): string {
    return (
      this.DOCUMENT_VERSIONS[consentType] ||
      this.configService.get<string>(`CONSENT_VERSION_${consentType}`) ||
      'v1.0'
    );
  }

  /**
   * Verificar consentimientos requeridos para registro
   */
  async validateRequiredConsents(
    personId: string | undefined,
    userId: string | undefined,
  ): Promise<{ valid: boolean; missing: ConsentType[] }> {
    const requiredConsents = [
      ConsentType.TERMS_AND_CONDITIONS,
      ConsentType.PRIVACY_POLICY,
    ];

    const missing: ConsentType[] = [];

    for (const consentType of requiredConsents) {
      const hasConsent = await this.hasValidConsent(
        personId,
        userId,
        consentType,
      );
      if (!hasConsent) {
        missing.push(consentType);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Obtener todos los consentimientos activos de un usuario
   */
  async getActiveConsents(
    personId: string | undefined,
    userId: string | undefined,
  ): Promise<ConsentLog[]> {
    if (!personId && !userId) {
      throw new BadRequestException(
        this.i18n.t('consent.person_or_user_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const queryBuilder =
      this.consentLogRepository.createQueryBuilder('consent');

    if (personId) {
      queryBuilder.andWhere('consent.personId = :personId', {
        personId,
      });
    }

    if (userId) {
      queryBuilder.andWhere('consent.userId = :userId', {
        userId,
      });
    }

    queryBuilder
      .andWhere('consent.revokedAt IS NULL')
      .orderBy('consent.acceptedAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Revocar todos los consentimientos de un usuario
   */
  async revokeAllConsents(
    personId: string | undefined,
    userId: string | undefined,
    reason?: string,
    revokedByUserId?: string,
  ): Promise<number> {
    if (!personId && !userId) {
      throw new BadRequestException(
        this.i18n.t('consent.person_or_user_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const activeConsents = await this.getActiveConsents(personId, userId);

    if (activeConsents.length === 0) {
      return 0;
    }

    for (const consent of activeConsents) {
      consent.revokedAt = new Date();
      consent.revokeReason = reason || 'Bulk revocation';
      if (revokedByUserId) {
        consent.revokedBy = { id: revokedByUserId } as any;
      }
    }

    await this.consentLogRepository.save(activeConsents);

    this.logger.log(
      `Bulk consent revocation: ${activeConsents.length} consents revoked - personId: ${personId}, userId: ${userId}`,
    );

    return activeConsents.length;
  }
}
