# Módulo de Auditoría

Sistema centralizado de log de auditoría para el tracking de cambios críticos en el sistema.

## Características

- **Registro automático**: Captura automática de cambios en entidades críticas mediante Entity Subscriber
- **Registro manual**: API simple para registrar auditorías desde servicios
- **Búsqueda avanzada**: Filtros por entidad, usuario, fecha, acción, etc.
- **Historial completo**: Valores anteriores y nuevos de cada cambio
- **Trazabilidad**: Usuario, IP, User Agent, razón del cambio
- **Seguridad**: Sanitización automática de datos sensibles
- **Global**: Disponible en toda la aplicación sin imports adicionales

## Estructura

```
src/audit/
├── entities/
│   └── audit-log.entity.ts        # Entidad principal
├── dto/
│   ├── create-audit-log.dto.ts    # DTO para crear logs
│   └── audit-log-filter.dto.ts    # DTO para filtros de búsqueda
├── enums/
│   └── audit-action.enum.ts       # Acciones: CREATE, UPDATE, DELETE, etc.
├── decorators/
│   └── auditable.decorator.ts     # Decorador @Auditable()
├── interceptors/
│   └── audit.interceptor.ts       # Interceptor para captura automática
├── subscribers/
│   └── audit.subscriber.ts        # Subscriber de TypeORM
├── audit.service.ts               # Servicio principal
├── audit.controller.ts            # Endpoints REST (solo admins)
├── audit.module.ts                # Módulo (Global)
└── README.md                      # Este archivo
```

## Uso Básico

### 1. Inyectar el servicio

Como el módulo es Global, solo necesitas inyectar el servicio:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly auditService: AuditService,
    // ... otros servicios
  ) {}
}
```

### 2. Registrar cambios manualmente

#### CREATE
```typescript
async createCertificate(dto: CreateCertificateDto, user: User) {
  const certificate = await this.certificateRepository.save(...);

  // Auditar creación
  await this.auditService.logCreate(
    'Certificate',
    certificate.id,
    {
      type: certificate.type,
      validationCode: certificate.validationCode,
      eventId: certificate.event.id
    },
    user,
    request.ip,
    request.headers['user-agent'],
  );

  return certificate;
}
```

#### UPDATE
```typescript
async updateGrade(id: string, dto: UpdateGradeDto, user: User, request: any) {
  const grade = await this.gradeRepository.findOne({ where: { id } });
  const previousValues = {
    grade: grade.grade,
    status: grade.status,
    comments: grade.comments
  };

  // Actualizar
  grade.grade = dto.grade;
  grade.status = dto.status;
  await this.gradeRepository.save(grade);

  const newValues = {
    grade: grade.grade,
    status: grade.status,
    comments: grade.comments
  };

  // Auditar cambio
  await this.auditService.logUpdate(
    'ParticipantGrade',
    id,
    previousValues,
    newValues,
    user,
    request.ip,
    request.headers['user-agent'],
    dto.reason, // Razón del cambio
  );

  return grade;
}
```

#### DELETE
```typescript
async deleteCertificate(id: string, user: User, reason: string) {
  const certificate = await this.certificateRepository.findOne({ where: { id } });

  const previousValues = {
    validationCode: certificate.validationCode,
    status: certificate.status
  };

  await this.certificateRepository.remove(certificate);

  // Auditar eliminación
  await this.auditService.logDelete(
    'Certificate',
    id,
    previousValues,
    user,
    null,
    null,
    reason,
  );
}
```

#### REVOKE (Revocar certificado)
```typescript
async revokeCertificate(id: string, user: User, reason: string) {
  const certificate = await this.certificateRepository.findOne({ where: { id } });

  const previousValues = { status: certificate.status };
  certificate.status = CertificateStatus.REVOKED;
  await this.certificateRepository.save(certificate);

  // Auditar revocación
  await this.auditService.logRevoke(
    'Certificate',
    id,
    previousValues,
    user,
    null,
    null,
    reason,
    { revokedBy: user.email },
  );
}
```

#### REISSUE (Reemitir certificado)
```typescript
async reissueCertificate(id: string, user: User) {
  const oldCert = await this.certificateRepository.findOne({ where: { id } });
  const newCert = await this.generateNewCertificate(oldCert);

  // Auditar reemisión
  await this.auditService.logReissue(
    'Certificate',
    id,
    { validationCode: oldCert.validationCode },
    { validationCode: newCert.validationCode },
    user,
  );

  return newCert;
}
```

#### MERGE (Fusión de personas)
```typescript
async mergePersons(sourceId: string, targetId: string, user: User) {
  const source = await this.personRepository.findOne({ where: { id: sourceId } });
  const target = await this.personRepository.findOne({ where: { id: targetId } });

  // Realizar fusión...

  // Auditar fusión
  await this.auditService.logMerge(
    'Person',
    targetId,
    { mergedFrom: sourceId },
    { ...target },
    user,
    null,
    null,
    `Fusión de persona ${sourceId} en ${targetId}`,
    { sourcePersonId: sourceId, targetPersonId: targetId },
  );
}
```

#### TRANSFER (Transferencia de ticket)
```typescript
async transferTicket(registrationId: string, newAttendeeId: string, user: User) {
  const registration = await this.registrationRepository.findOne({ where: { id: registrationId } });

  const previousValues = { attendeeId: registration.attendee.id };
  registration.attendee = await this.attendeeRepository.findOne({ where: { id: newAttendeeId } });
  await this.registrationRepository.save(registration);

  // Auditar transferencia
  await this.auditService.logTransfer(
    'Registration',
    registrationId,
    previousValues,
    { attendeeId: newAttendeeId },
    user,
    null,
    null,
    'Transferencia de ticket',
    {
      fromAttendeeId: previousValues.attendeeId,
      toAttendeeId: newAttendeeId
    },
  );
}
```

### 3. Consultar historial

#### Historial de una entidad específica
```typescript
// Ver todos los cambios en un certificado
const history = await this.auditService.findByEntity(
  'Certificate',
  certificateId,
  50 // límite de registros
);
```

#### Acciones de un usuario
```typescript
// Ver todas las acciones de un usuario (con paginación)
const { data, total, pages } = await this.auditService.findByUser(
  userId,
  1,  // página
  20  // límite por página
);
```

#### Búsqueda avanzada
```typescript
// Búsqueda con múltiples filtros
const { data, total, pages } = await this.auditService.findAll({
  entityType: 'Certificate',
  action: AuditAction.UPDATE,
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  performedById: userId,
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
});
```

## Auditoría Automática (Subscriber)

El sistema captura automáticamente cambios en estas entidades:

- `Certificate` - Emisión, revocación, reemisión
- `ParticipantGrade` - Cambios de notas
- `SessionAttendance` - Registro de asistencia
- `Registration` - Cambios de estado
- `Payment` - Cambios de estado de pagos
- `Refund` - Ciclo completo de reembolsos
- `Person` - Fusión, cambios de datos

**Nota**: El subscriber registra cambios con `performedByEmail: 'system'` ya que no tiene contexto del usuario. Para registros con usuario, usa el servicio manualmente.

## API REST (Solo Admins)

### Listar todos los logs
```http
GET /audit?entityType=Certificate&action=UPDATE&page=1&limit=20
```

### Obtener log específico
```http
GET /audit/:id
```

### Historial de una entidad
```http
GET /audit/entity/Certificate/:certificateId?limit=50
```

### Acciones de un usuario
```http
GET /audit/user/:userId?page=1&limit=20
```

## Campos del Registro de Auditoría

```typescript
{
  id: string;                           // UUID del log
  entityType: string;                   // 'Certificate', 'ParticipantGrade', etc.
  entityId: string;                     // ID de la entidad afectada
  action: AuditAction;                  // CREATE, UPDATE, DELETE, etc.
  previousValues: Record<string, any>;  // Valores anteriores (JSON)
  newValues: Record<string, any>;       // Valores nuevos (JSON)
  changedFields: string[];              // Campos que cambiaron
  performedBy: User;                    // Usuario que realizó el cambio
  performedByEmail: string;             // Email del usuario (backup)
  ipAddress: string;                    // IP del cliente
  userAgent: string;                    // Navegador/cliente
  reason: string;                       // Motivo del cambio (opcional)
  metadata: Record<string, any>;        // Metadata adicional
  createdAt: Date;                      // Fecha y hora del cambio
}
```

## Seguridad

### Sanitización Automática

Los siguientes campos se sanitizan automáticamente (se reemplazan con `[REDACTED]`):

- `password`
- `currentRefreshToken`
- `resetPasswordToken`
- `verificationToken`
- `accessToken`
- `refreshToken`
- `secret`
- `apiKey`
- `privateKey`

### Campos Ignorados

Estos campos NO se registran en la auditoría:

- `updatedAt` (se registra automáticamente en createdAt)
- `password` (sanitizado)
- `*Token` (sanitizado)

## Decorador @Auditable() (Avanzado)

Puedes marcar métodos para auditoría automática:

```typescript
import { Auditable } from '../audit/decorators/auditable.decorator';

@Auditable('Certificate', { captureReturn: true })
async createCertificate(dto: CreateCertificateDto) {
  // El resultado se auditará automáticamente
  return this.certificateRepository.save(...);
}
```

**Nota**: Este enfoque requiere el `AuditInterceptor` aplicado al controlador.

## Mejores Prácticas

1. **Usa helpers específicos**: `logCreate`, `logUpdate`, `logRevoke`, etc. en lugar de `log()` genérico
2. **Incluye contexto**: Siempre pasa `user`, `ip`, `userAgent` cuando estén disponibles
3. **Agrega razón**: Para cambios administrativos críticos, incluye el campo `reason`
4. **Metadata útil**: Usa `metadata` para información adicional (IDs relacionados, contexto)
5. **No audites todo**: Solo cambios relevantes (notas, certificados, pagos, etc.)
6. **Captura antes del cambio**: Guarda `previousValues` ANTES de modificar la entidad

## Índices de Base de Datos

Los siguientes índices están creados para búsquedas eficientes:

- `IDX_audit_logs_entity_type` - Por tipo de entidad
- `IDX_audit_logs_entity_id` - Por ID de entidad
- `IDX_audit_logs_created_at` - Por fecha
- `IDX_audit_logs_performed_by` - Por usuario
- `IDX_audit_logs_entity_type_entity_id` - Compuesto (tipo + ID)

## Migración

La migración se encuentra en:
```
src/database/migrations/1733460000000-CreateAuditLogsTable.ts
```

Para ejecutarla:
```bash
npm run migration:run
```

## Ejemplo Completo: Cambio de Nota

```typescript
@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(ParticipantGrade)
    private readonly gradeRepository: Repository<ParticipantGrade>,
    private readonly auditService: AuditService,
  ) {}

  async updateGrade(
    id: string,
    dto: UpdateGradeDto,
    user: User,
    request: any,
  ): Promise<ParticipantGrade> {
    // 1. Obtener estado actual
    const grade = await this.gradeRepository.findOne({
      where: { id },
      relations: ['enrollment', 'evaluation'],
    });

    if (!grade) {
      throw new NotFoundException('Nota no encontrada');
    }

    // 2. Guardar valores anteriores
    const previousValues = {
      grade: grade.grade,
      normalizedGrade: grade.normalizedGrade,
      comments: grade.comments,
      status: grade.status,
    };

    // 3. Aplicar cambios
    grade.grade = dto.grade;
    grade.normalizedGrade = this.calculateNormalizedGrade(dto.grade, grade.evaluation);
    grade.comments = dto.comments;
    grade.lastModifiedBy = user;

    // 4. Guardar
    const updatedGrade = await this.gradeRepository.save(grade);

    // 5. Valores nuevos
    const newValues = {
      grade: updatedGrade.grade,
      normalizedGrade: updatedGrade.normalizedGrade,
      comments: updatedGrade.comments,
      status: updatedGrade.status,
    };

    // 6. Auditar cambio
    await this.auditService.logUpdate(
      'ParticipantGrade',
      id,
      previousValues,
      newValues,
      user,
      request.ip,
      request.headers['user-agent'],
      dto.reason || 'Actualización de nota',
      {
        enrollmentId: grade.enrollment.id,
        evaluationId: grade.evaluation.id,
        previousGrade: previousValues.grade,
        newGrade: newValues.grade,
      },
    );

    return updatedGrade;
  }
}
```

## Soporte

Para preguntas o issues, contactar al equipo de desarrollo.
