import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  InsertEvent,
  RemoveEvent,
  Connection,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { AuditService } from '../audit.service';
import { AuditAction } from '../enums/audit-action.enum';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { ParticipantGrade } from '../../evaluations/entities/participant-grade.entity';
import { SessionAttendance } from '../../evaluations/entities/session-attendance.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Refund } from '../../refunds/entities/refund.entity';
import { Person } from '../../persons/entities/person.entity';

/**
 * Subscriber de TypeORM que captura automáticamente cambios en entidades críticas
 * y crea registros de auditoría
 */
@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  // Entidades que deben ser auditadas automáticamente
  private readonly auditableEntities = [
    Certificate,
    ParticipantGrade,
    SessionAttendance,
    Registration,
    Payment,
    Refund,
    Person,
  ];

  constructor(
    @InjectConnection() connection: Connection,
    private readonly auditService: AuditService,
  ) {
    connection.subscribers.push(this);
  }

  /**
   * Determina si esta entidad debe ser auditada
   */
  private isAuditable(entity: any): boolean {
    if (!entity) return false;

    return this.auditableEntities.some(
      (auditableEntity) => entity instanceof auditableEntity,
    );
  }

  /**
   * Obtiene el nombre de la entidad
   */
  private getEntityName(entity: any): string {
    return entity.constructor.name;
  }

  /**
   * Serializa una entidad para la auditoría
   */
  private serializeEntity(entity: any): Record<string, any> | null {
    if (!entity) return null;

    const serialized: Record<string, any> = {};

    // Copiar propiedades primitivas
    for (const key in entity) {
      if (entity.hasOwnProperty(key)) {
        const value = entity[key];

        // Ignorar relaciones cargadas (objetos complejos)
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Si tiene un id, solo guardar el id de la relación
          if (value.id) {
            serialized[`${key}Id`] = value.id;
          }
        } else {
          serialized[key] = value;
        }
      }
    }

    return serialized;
  }

  /**
   * Captura inserciones (CREATE)
   */
  async afterInsert(event: InsertEvent<any>): Promise<void> {
    if (!this.isAuditable(event.entity)) return;

    const entityType = this.getEntityName(event.entity);
    const entityId = event.entity.id;
    const newValues = this.serializeEntity(event.entity);

    await this.auditService.log({
      entityType,
      entityId,
      action: AuditAction.CREATE,
      previousValues: null,
      newValues,
      performedByEmail: 'system', // El subscriber no tiene contexto del usuario
      metadata: {
        source: 'subscriber',
        operation: 'afterInsert',
      },
    });
  }

  /**
   * Captura actualizaciones (UPDATE)
   */
  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    if (!event.entity || !this.isAuditable(event.entity)) return;

    const entityType = this.getEntityName(event.entity);
    const entityId = event.entity.id;

    // Obtener valores anteriores del database entity
    const previousValues = this.serializeEntity(event.databaseEntity);
    const newValues = this.serializeEntity(event.entity);

    // Solo registrar si hay cambios reales
    if (JSON.stringify(previousValues) === JSON.stringify(newValues)) {
      return;
    }

    await this.auditService.log({
      entityType,
      entityId,
      action: AuditAction.UPDATE,
      previousValues,
      newValues,
      performedByEmail: 'system',
      metadata: {
        source: 'subscriber',
        operation: 'afterUpdate',
        updatedColumns: event.updatedColumns?.map((col) => col.propertyName),
      },
    });
  }

  /**
   * Captura eliminaciones (DELETE)
   */
  async beforeRemove(event: RemoveEvent<any>): Promise<void> {
    if (!this.isAuditable(event.entity)) return;

    const entityType = this.getEntityName(event.entity);
    const entityId = event.entity.id;
    const previousValues = this.serializeEntity(event.entity);

    await this.auditService.log({
      entityType,
      entityId,
      action: AuditAction.DELETE,
      previousValues,
      newValues: null,
      performedByEmail: 'system',
      metadata: {
        source: 'subscriber',
        operation: 'beforeRemove',
      },
    });
  }
}
