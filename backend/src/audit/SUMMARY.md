# Sistema de Auditoría - Resumen Ejecutivo

## Implementación Completada

El sistema de Log de Auditoría centralizado ha sido implementado exitosamente con todas las características solicitadas.

## Estructura Creada

```
src/audit/
├── entities/
│   └── audit-log.entity.ts           # Entidad AuditLog con todos los campos requeridos
├── dto/
│   ├── create-audit-log.dto.ts       # DTO para crear logs
│   └── audit-log-filter.dto.ts       # DTO para filtros de búsqueda
├── enums/
│   └── audit-action.enum.ts          # CREATE, UPDATE, DELETE, REVOKE, etc.
├── decorators/
│   └── auditable.decorator.ts        # Decorador @Auditable() (opcional)
├── interceptors/
│   └── audit.interceptor.ts          # Interceptor para captura automática
├── subscribers/
│   └── audit.subscriber.ts           # TypeORM subscriber para auditoría automática
├── audit.service.ts                  # Servicio principal con helpers
├── audit.controller.ts               # Endpoints REST (solo admins)
├── audit.module.ts                   # Módulo global
├── index.ts                          # Exports centralizados
├── README.md                         # Documentación completa
├── INTEGRATION_EXAMPLE.md            # Ejemplos de integración
└── SUMMARY.md                        # Este archivo
```

## Migración de Base de Datos

Archivo creado:
```
src/database/migrations/1733460000000-CreateAuditLogsTable.ts
```

Para ejecutar:
```bash
npm run migration:run
```

## Características Implementadas

### ✅ 1. Entidad AuditLog Completa
- `id` - UUID del log
- `entityType` - Tipo de entidad (Certificate, ParticipantGrade, etc.)
- `entityId` - ID de la entidad afectada
- `action` - Acción realizada (CREATE, UPDATE, DELETE, REVOKE, etc.)
- `previousValues` - Valores anteriores (JSONB)
- `newValues` - Valores nuevos (JSONB)
- `changedFields` - Campos que cambiaron (array)
- `performedBy` - Usuario que realizó el cambio
- `performedByEmail` - Email del usuario (backup)
- `ipAddress` - IP del cliente
- `userAgent` - Navegador/cliente
- `reason` - Motivo del cambio (opcional)
- `metadata` - Metadata adicional (JSONB)
- `createdAt` - Fecha y hora del cambio

### ✅ 2. AuditService con Helpers
Métodos principales:
- `log()` - Crear log genérico
- `logCreate()` - Helper para CREATE
- `logUpdate()` - Helper para UPDATE
- `logDelete()` - Helper para DELETE
- `logRevoke()` - Helper para REVOKE (certificados)
- `logReissue()` - Helper para REISSUE (reemisión)
- `logMerge()` - Helper para MERGE (fusión de personas)
- `logTransfer()` - Helper para TRANSFER (transferencia de tickets)
- `logRestore()` - Helper para RESTORE

Métodos de consulta:
- `findByEntity()` - Historial de una entidad específica
- `findByUser()` - Acciones de un usuario (con paginación)
- `findAll()` - Búsqueda avanzada con filtros
- `findOne()` - Log específico por ID

### ✅ 3. AuditController (Solo Admins)
Endpoints:
- `GET /audit` - Listar logs con filtros
- `GET /audit/:id` - Detalle de un log
- `GET /audit/entity/:type/:id` - Historial de una entidad
- `GET /audit/user/:userId` - Acciones de un usuario

### ✅ 4. Auditoría Automática
**AuditSubscriber** captura automáticamente cambios en:
- `Certificate` - Emisión, revocación, reemisión
- `ParticipantGrade` - Cambios de notas
- `SessionAttendance` - Registro de asistencia
- `Registration` - Cambios de estado
- `Payment` - Cambios de estado de pagos
- `Refund` - Ciclo completo de reembolsos
- `Person` - Fusión, cambios de datos

### ✅ 5. Seguridad
- **Sanitización automática** de datos sensibles (passwords, tokens, etc.)
- **Campos ignorados** (updatedAt, tokens, passwords)
- **Logs inmutables** (never delete)
- **Relación ON DELETE SET NULL** (preserva logs si el usuario se elimina)

### ✅ 6. Optimización
Índices creados para búsquedas eficientes:
- `IDX_audit_logs_entity_type` - Por tipo de entidad
- `IDX_audit_logs_entity_id` - Por ID de entidad
- `IDX_audit_logs_created_at` - Por fecha
- `IDX_audit_logs_performed_by` - Por usuario
- `IDX_audit_logs_entity_type_entity_id` - Compuesto (tipo + ID)

### ✅ 7. Módulo Global
El `AuditModule` está marcado como `@Global()`, lo que significa:
- Disponible en toda la aplicación sin imports adicionales
- Solo se importa una vez en `AppModule`
- Cualquier servicio puede inyectar `AuditService` directamente

## Uso Básico

### En un servicio:
```typescript
@Injectable()
export class CertificatesService {
  constructor(
    private readonly auditService: AuditService, // Inyección directa
  ) {}

  async revokeCertificate(id: string, user: User, reason: string) {
    const cert = await this.findOne(id);
    const previousStatus = cert.status;

    cert.status = CertificateStatus.REVOKED;
    await this.certificateRepository.save(cert);

    // Auditar revocación
    await this.auditService.logRevoke(
      'Certificate',
      id,
      { status: previousStatus },
      user,
      null,
      null,
      reason,
    );
  }
}
```

### Consultar historial:
```typescript
// En un servicio
const history = await this.auditService.findByEntity('Certificate', certificateId);

// Vía API (solo admins)
GET /audit/entity/Certificate/123e4567-e89b-12d3-a456-426614174000
```

## Acciones Disponibles (AuditAction)

```typescript
enum AuditAction {
  CREATE = 'CREATE',       // Creación de entidad
  UPDATE = 'UPDATE',       // Actualización
  DELETE = 'DELETE',       // Eliminación
  RESTORE = 'RESTORE',     // Restauración
  REVOKE = 'REVOKE',       // Revocación (certificados)
  MERGE = 'MERGE',         // Fusión (personas)
  TRANSFER = 'TRANSFER',   // Transferencia (tickets)
  REISSUE = 'REISSUE',     // Reemisión (certificados)
}
```

## Entidades Auditadas Automáticamente

El `AuditSubscriber` ya está configurado para capturar automáticamente cambios en:

1. **Certificate** - Todos los cambios (create, update, delete)
2. **ParticipantGrade** - Cambios de notas
3. **SessionAttendance** - Registro de asistencia
4. **Registration** - Cambios de estado
5. **Payment** - Cambios de estado de pagos
6. **Refund** - Todo el ciclo de reembolsos
7. **Person** - Fusión, cambios de datos

**Nota**: El subscriber registra con `performedByEmail: 'system'` porque no tiene contexto del usuario. Para registros con usuario, usa el servicio manualmente.

## Próximos Pasos de Integración

### 1. Ejecutar la migración
```bash
cd backend
npm run migration:run
```

### 2. Integrar en servicios críticos
Ver `INTEGRATION_EXAMPLE.md` para ejemplos detallados de:
- CertificatesService (revocación, reemisión)
- GradesService (cambios de notas)
- PaymentsService (cambios de estado)
- PersonsService (fusión)
- RegistrationsService (cambios de estado)

### 3. Ejemplos de integración prioritarios
Servicios que **DEBEN** integrar auditoría manual:
- ✅ `CertificatesService.revokeCertificate()` - Al revocar certificados
- ✅ `CertificatesService.reissueCertificate()` - Al reemitir certificados
- ✅ `GradesService.updateGrade()` - Al cambiar notas
- ✅ `AttendanceService.markAttendance()` - Al marcar asistencia
- ✅ `PaymentsService.updateStatus()` - Al cambiar estado de pagos
- ✅ `RefundsService.processRefund()` - Al procesar reembolsos
- ✅ `PersonsService.mergePersons()` - Al fusionar personas
- ✅ `RegistrationsService.transferTicket()` - Al transferir tickets

## Verificación

### Compilación
El módulo compila sin errores (verificado con `npm run build`)

### Tests
Para ejecutar tests del módulo de auditoría (si se crean):
```bash
npm test -- audit
```

### Verificar logs en base de datos
```sql
-- Ver últimos 10 logs
SELECT * FROM audit_logs ORDER BY "createdAt" DESC LIMIT 10;

-- Ver logs de un certificado específico
SELECT * FROM audit_logs
WHERE "entityType" = 'Certificate'
  AND "entityId" = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY "createdAt" DESC;

-- Ver acciones de un usuario
SELECT al.*, u.email
FROM audit_logs al
LEFT JOIN users u ON al."performedById" = u.id
WHERE al."performedById" = '123e4567-e89b-12d3-a456-426614174001'
ORDER BY al."createdAt" DESC;

-- Ver revocaciones en el último mes
SELECT * FROM audit_logs
WHERE action = 'REVOKE'
  AND "createdAt" >= NOW() - INTERVAL '1 month'
ORDER BY "createdAt" DESC;
```

## Documentación

- **README.md** - Documentación completa del módulo
- **INTEGRATION_EXAMPLE.md** - Ejemplos prácticos de integración
- **SUMMARY.md** - Este resumen ejecutivo

## Mantenimiento

### Logs nunca se eliminan
Los logs de auditoría son **inmutables** y nunca deben eliminarse. Solo se pueden consultar.

### Limpieza (si necesario en el futuro)
Si eventualmente se necesita archivar logs antiguos (ej. > 5 años):
```sql
-- Crear tabla de archivo
CREATE TABLE audit_logs_archive AS SELECT * FROM audit_logs;

-- Mover logs antiguos
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE "createdAt" < NOW() - INTERVAL '5 years';

-- NO ejecutar DELETE a menos que sea absolutamente necesario
```

## Soporte

Para preguntas o issues:
1. Revisar `README.md` - Documentación completa
2. Revisar `INTEGRATION_EXAMPLE.md` - Ejemplos de código
3. Contactar al equipo de desarrollo

---

**Estado**: ✅ Implementación completa y lista para uso
**Fecha**: 2024-12-05
**Versión**: 1.0.0
