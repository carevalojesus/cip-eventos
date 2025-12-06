import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogFilterDto } from './dto/audit-log-filter.dto';
import { AuditAction } from './enums/audit-action.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Crea una entrada de auditoría
   */
  async log(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog | null> {
    try {
      // Sanitizar datos sensibles antes de guardar
      const sanitizedPreviousValues = this.sanitizeValues(
        createAuditLogDto.previousValues ?? null,
      );
      const sanitizedNewValues = this.sanitizeValues(
        createAuditLogDto.newValues ?? null,
      );

      const auditLog = this.auditLogRepository.create({
        ...createAuditLogDto,
        previousValues: sanitizedPreviousValues,
        newValues: sanitizedNewValues,
      });

      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(
        `Error creating audit log: ${error.message}`,
        error.stack,
      );
      // No lanzar error para no interrumpir el flujo principal
      return null;
    }
  }

  /**
   * Helper para crear un log de tipo CREATE
   */
  async logCreate(
    entityType: string,
    entityId: string,
    newValues: Record<string, any>,
    user?: User,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog | null> {
    return this.log({
      entityType,
      entityId,
      action: AuditAction.CREATE,
      previousValues: null,
      newValues,
      performedBy: user || null,
      performedByEmail: user?.email || null,
      ipAddress,
      userAgent,
      metadata,
    });
  }

  /**
   * Helper para crear un log de tipo UPDATE
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    previousValues: Record<string, any>,
    newValues: Record<string, any>,
    user?: User,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog | null> {
    // Calcular campos que cambiaron
    const changedFields = this.getChangedFields(previousValues, newValues);

    // Si no hay cambios, no registrar
    if (changedFields.length === 0) {
      return null;
    }

    return this.log({
      entityType,
      entityId,
      action: AuditAction.UPDATE,
      previousValues,
      newValues,
      changedFields,
      performedBy: user || null,
      performedByEmail: user?.email || null,
      ipAddress,
      userAgent,
      reason,
      metadata,
    });
  }

  /**
   * Helper para crear un log de tipo DELETE
   */
  async logDelete(
    entityType: string,
    entityId: string,
    previousValues: Record<string, any>,
    user?: User,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog | null> {
    return this.log({
      entityType,
      entityId,
      action: AuditAction.DELETE,
      previousValues,
      newValues: null,
      performedBy: user || null,
      performedByEmail: user?.email || null,
      ipAddress,
      userAgent,
      reason,
      metadata,
    });
  }

  /**
   * Helper para crear un log de tipo REVOKE
   */
  async logRevoke(
    entityType: string,
    entityId: string,
    previousValues: Record<string, any>,
    user?: User,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog | null> {
    return this.log({
      entityType,
      entityId,
      action: AuditAction.REVOKE,
      previousValues,
      newValues: null,
      performedBy: user || null,
      performedByEmail: user?.email || null,
      ipAddress,
      userAgent,
      reason,
      metadata,
    });
  }

  /**
   * Helper para crear un log de tipo RESTORE
   */
  async logRestore(
    entityType: string,
    entityId: string,
    newValues: Record<string, any>,
    user?: User,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog | null> {
    return this.log({
      entityType,
      entityId,
      action: AuditAction.RESTORE,
      previousValues: null,
      newValues,
      performedBy: user || null,
      performedByEmail: user?.email || null,
      ipAddress,
      userAgent,
      reason,
      metadata,
    });
  }

  /**
   * Helper para crear un log de tipo REISSUE (reemisión de certificados)
   */
  async logReissue(
    entityType: string,
    entityId: string,
    previousValues: Record<string, any>,
    newValues: Record<string, any>,
    user?: User,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog | null> {
    return this.log({
      entityType,
      entityId,
      action: AuditAction.REISSUE,
      previousValues,
      newValues,
      performedBy: user || null,
      performedByEmail: user?.email || null,
      ipAddress,
      userAgent,
      reason,
      metadata,
    });
  }

  /**
   * Helper para crear un log de tipo MERGE (fusión de personas)
   */
  async logMerge(
    entityType: string,
    entityId: string,
    previousValues: Record<string, any>,
    newValues: Record<string, any>,
    user?: User,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog | null> {
    return this.log({
      entityType,
      entityId,
      action: AuditAction.MERGE,
      previousValues,
      newValues,
      performedBy: user || null,
      performedByEmail: user?.email || null,
      ipAddress,
      userAgent,
      reason,
      metadata,
    });
  }

  /**
   * Helper para crear un log de tipo TRANSFER (transferencia de tickets)
   */
  async logTransfer(
    entityType: string,
    entityId: string,
    previousValues: Record<string, any>,
    newValues: Record<string, any>,
    user?: User,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog | null> {
    return this.log({
      entityType,
      entityId,
      action: AuditAction.TRANSFER,
      previousValues,
      newValues,
      performedBy: user || null,
      performedByEmail: user?.email || null,
      ipAddress,
      userAgent,
      reason,
      metadata,
    });
  }

  /**
   * Obtiene el historial de auditoría de una entidad específica
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        entityType,
        entityId,
      },
      relations: ['performedBy'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Obtiene todas las acciones realizadas por un usuario
   */
  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: AuditLog[]; total: number; pages: number }> {
    const [data, total] = await this.auditLogRepository.findAndCount({
      where: {
        performedBy: { id: userId },
      },
      relations: ['performedBy'],
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Búsqueda avanzada con filtros
   */
  async findAll(
    filterDto: AuditLogFilterDto,
  ): Promise<{ data: AuditLog[]; total: number; pages: number }> {
    const {
      entityType,
      entityId,
      action,
      performedById,
      performedByEmail,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const where: FindOptionsWhere<AuditLog> = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (action) {
      where.action = action;
    }

    if (performedById) {
      where.performedBy = { id: performedById };
    }

    if (performedByEmail) {
      where.performedByEmail = performedByEmail;
    }

    if (dateFrom && dateTo) {
      where.createdAt = Between(new Date(dateFrom), new Date(dateTo));
    } else if (dateFrom) {
      where.createdAt = Between(new Date(dateFrom), new Date());
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ['performedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene un log específico por ID
   */
  async findOne(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({
      where: { id },
      relations: ['performedBy'],
    });
  }

  /**
   * Determina qué campos cambiaron entre dos objetos
   */
  private getChangedFields(
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
  ): string[] {
    const changed: string[] = [];

    if (!oldValues || !newValues) {
      return changed;
    }

    const allKeys = new Set([
      ...Object.keys(oldValues),
      ...Object.keys(newValues),
    ]);

    for (const key of allKeys) {
      // Ignorar campos que no deben auditarse
      if (this.shouldIgnoreField(key)) {
        continue;
      }

      const oldValue = oldValues[key];
      const newValue = newValues[key];

      // Comparar valores
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changed.push(key);
      }
    }

    return changed;
  }

  /**
   * Sanitiza valores para remover datos sensibles
   */
  private sanitizeValues(
    values: Record<string, any> | null,
  ): Record<string, any> | null {
    if (!values) {
      return null;
    }

    const sanitized = { ...values };
    const sensitiveFields = [
      'password',
      'currentRefreshToken',
      'resetPasswordToken',
      'verificationToken',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'privateKey',
    ];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Determina si un campo debe ser ignorado en la auditoría
   */
  private shouldIgnoreField(fieldName: string): boolean {
    const ignoredFields = [
      'updatedAt',
      'currentRefreshToken',
      'password',
      'resetPasswordToken',
      'verificationToken',
    ];

    return ignoredFields.includes(fieldName);
  }
}
