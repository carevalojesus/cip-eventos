# Instrucciones de Despliegue - Sistema de Auditoría

## Pre-requisitos

- Base de datos PostgreSQL activa
- Variables de entorno configuradas (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`)
- Node.js y npm instalados

## Pasos de Despliegue

### 1. Verificar Compilación

Antes de desplegar, asegúrate de que el código compila sin errores:

```bash
cd backend
npm run build
```

**Resultado esperado**:
- El módulo de auditoría debe compilar sin errores
- Pueden existir errores en otros módulos (no relacionados con auditoría)

### 2. Ejecutar Migración

La migración creará la tabla `audit_logs` con todos los índices necesarios:

```bash
# En desarrollo
npm run migration:run

# En producción (si tienes un script diferente)
npm run migration:run:prod
```

**Verificar migración exitosa**:
```sql
-- Conectarse a la base de datos y ejecutar:
\dt audit_logs
```

Debería mostrar la tabla `audit_logs`.

### 3. Verificar Estructura de la Tabla

```sql
-- Ver estructura de la tabla
\d audit_logs

-- Resultado esperado:
-- Columnas: id, entityType, entityId, action, previousValues, newValues,
--           changedFields, performedById, performedByEmail, ipAddress,
--           userAgent, reason, metadata, createdAt
```

### 4. Verificar Índices

```sql
-- Ver índices creados
\di audit_logs*

-- Deberían existir:
-- - IDX_audit_logs_entity_type
-- - IDX_audit_logs_entity_id
-- - IDX_audit_logs_created_at
-- - IDX_audit_logs_performed_by
-- - IDX_audit_logs_entity_type_entity_id
```

### 5. Verificar Foreign Keys

```sql
-- Ver constraints
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'audit_logs'::regclass;

-- Debería existir:
-- - FK_audit_logs_performed_by -> users(id) ON DELETE SET NULL
```

### 6. Reiniciar Aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

### 7. Verificar que el Módulo Cargó

Revisar los logs de la aplicación al iniciar:

```
[Nest] ... [InstanceLoader] AuditModule dependencies initialized +X ms
[Nest] ... [RoutesResolver] AuditController {/audit}: +X ms
```

### 8. Probar Endpoints (Solo Admins)

```bash
# Autenticarse como admin
TOKEN="tu-token-de-admin"

# Listar logs (debería estar vacío inicialmente)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/audit

# Respuesta esperada:
# {
#   "data": [],
#   "total": 0,
#   "pages": 0
# }
```

### 9. Probar Auditoría Automática

El `AuditSubscriber` comenzará a capturar cambios automáticamente.

**Crear una entidad auditada**:
```bash
# Por ejemplo, crear un certificado
curl -X POST http://localhost:3000/certificates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Verificar que se creó un log**:
```sql
SELECT * FROM audit_logs
WHERE "entityType" = 'Certificate'
ORDER BY "createdAt" DESC
LIMIT 1;
```

### 10. Integrar en Servicios (Gradual)

**Prioridad Alta** (integrar primero):
1. `CertificatesService` - Revocación, reemisión
2. `GradesService` - Cambios de notas
3. `PaymentsService` - Cambios de estado

**Prioridad Media**:
4. `RefundsService` - Procesamiento de reembolsos
5. `PersonsService` - Fusión de personas
6. `RegistrationsService` - Transferencias

**Prioridad Baja** (auditoría automática suficiente):
7. Otras entidades (ya cubiertas por `AuditSubscriber`)

## Rollback (Si Necesario)

Si necesitas revertir la migración:

```bash
npm run migration:revert
```

Esto ejecutará el método `down()` de la migración que:
1. Elimina foreign keys
2. Elimina índices
3. Elimina tabla `audit_logs`
4. Elimina enum `audit_logs_action_enum`

## Monitoreo Post-Despliegue

### 1. Monitorear Crecimiento de la Tabla

```sql
-- Ver cantidad de registros
SELECT COUNT(*) FROM audit_logs;

-- Ver tamaño de la tabla
SELECT pg_size_pretty(pg_total_relation_size('audit_logs'));

-- Ver registros por día (últimos 7 días)
SELECT DATE("createdAt") as date, COUNT(*) as count
FROM audit_logs
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

### 2. Monitorear Performance de Índices

```sql
-- Ver uso de índices
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'audit_logs'
ORDER BY idx_scan DESC;
```

### 3. Logs de Aplicación

Revisar logs de la aplicación para errores en auditoría:

```bash
# Buscar errores de auditoría
grep "Error creating audit log" logs/application.log
```

**Nota**: El `AuditService` nunca lanza errores para no interrumpir el flujo principal. Los errores se registran en logs.

### 4. Queries de Análisis

```sql
-- Acciones más frecuentes
SELECT action, COUNT(*) as count
FROM audit_logs
GROUP BY action
ORDER BY count DESC;

-- Usuarios más activos
SELECT u.email, COUNT(*) as actions
FROM audit_logs al
JOIN users u ON al."performedById" = u.id
GROUP BY u.email
ORDER BY actions DESC
LIMIT 10;

-- Entidades más modificadas
SELECT "entityType", COUNT(*) as changes
FROM audit_logs
WHERE action = 'UPDATE'
GROUP BY "entityType"
ORDER BY changes DESC;

-- Cambios en las últimas 24 horas
SELECT "entityType", action, COUNT(*) as count
FROM audit_logs
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY "entityType", action
ORDER BY count DESC;
```

## Mantenimiento

### Limpieza de Logs Antiguos (Futuro)

**IMPORTANTE**: No implementar hasta que sea absolutamente necesario.

Si eventualmente la tabla crece demasiado (ej. > 10 millones de registros):

```sql
-- Crear particionamiento por fecha (PostgreSQL 10+)
-- O
-- Archivar logs antiguos en tabla separada

-- NO EJECUTAR DELETE a menos que sea crítico
-- Los logs de auditoría deben ser permanentes
```

### Backup

Asegurarse de que `audit_logs` está incluida en backups:

```bash
# Backup específico de audit_logs
pg_dump -U username -d database_name -t audit_logs > audit_logs_backup.sql

# Verificar backup
wc -l audit_logs_backup.sql
```

## Troubleshooting

### La tabla no existe después de la migración
```bash
# Verificar si la migración se ejecutó
npm run migration:show

# Re-ejecutar migración
npm run migration:run
```

### Los logs no se crean
1. Verificar que el módulo está importado en `AppModule`
2. Verificar que `AuditSubscriber` está registrado
3. Revisar logs de aplicación para errores
4. Verificar que las entidades están en la lista de `auditableEntities`

### Error: "Cannot inject AuditService"
- Asegurarse de que `AuditModule` está marcado como `@Global()`
- Reiniciar la aplicación

### Performance lenta en consultas
```sql
-- Verificar que los índices existen
\di audit_logs*

-- Re-crear índices si es necesario
REINDEX TABLE audit_logs;

-- Analizar tabla
ANALYZE audit_logs;
```

### Tabla crece muy rápido
1. Revisar que el subscriber solo audita entidades críticas
2. Considerar reducir la lista de `auditableEntities` en `AuditSubscriber`
3. Revisar si hay loops de actualización

## Checklist de Despliegue

- [ ] Código compila sin errores (`npm run build`)
- [ ] Migración ejecutada exitosamente (`npm run migration:run`)
- [ ] Tabla `audit_logs` existe en la base de datos
- [ ] Índices creados correctamente
- [ ] Foreign key a `users` existe
- [ ] Aplicación reiniciada
- [ ] Módulo `AuditModule` cargó correctamente (revisar logs)
- [ ] Endpoint `/audit` responde (solo para admins)
- [ ] Auditoría automática funciona (crear una entidad y verificar log)
- [ ] Documentación revisada (`README.md`, `INTEGRATION_EXAMPLE.md`)

## Próximos Pasos

1. ✅ Desplegar el sistema
2. ⏳ Integrar en `CertificatesService` (revocación, reemisión)
3. ⏳ Integrar en `GradesService` (cambios de notas)
4. ⏳ Integrar en `PaymentsService` (cambios de estado)
5. ⏳ Integrar en otros servicios según prioridad
6. ⏳ Crear tests unitarios para `AuditService`
7. ⏳ Crear tests de integración para subscriber
8. ⏳ Documentar políticas de retención de logs

## Soporte

Para problemas durante el despliegue:
1. Revisar esta guía
2. Revisar `SUMMARY.md` para overview del sistema
3. Revisar logs de aplicación
4. Contactar al equipo de desarrollo

---

**Versión**: 1.0.0
**Fecha**: 2024-12-05
