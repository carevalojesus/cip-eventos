# Implementación de Reportes Programados

## Resumen

Se ha implementado un sistema completo de reportes automáticos programados que permite enviar reportes por correo electrónico de forma automática según una configuración de frecuencia.

## Características Implementadas

### 1. Tipos de Reportes Disponibles

- **DAILY_REGISTRATIONS**: Inscripciones diarias
- **DAILY_ATTENDANCE**: Asistencia diaria
- **DAILY_REVENUE**: Ingresos diarios
- **WEEKLY_SUMMARY**: Resumen semanal
- **MONTHLY_SUMMARY**: Resumen mensual
- **FINANCIAL_SUMMARY**: Resumen financiero completo
- **CERTIFICATE_SUMMARY**: Resumen de certificados emitidos
- **EVENT_FINAL_REPORT**: Reporte final del evento

### 2. Frecuencias de Envío

- **DAILY**: Diario (configurable hora de envío)
- **WEEKLY**: Semanal (configurable día de la semana)
- **MONTHLY**: Mensual (configurable día del mes)
- **ON_EVENT_END**: Al finalizar el evento

### 3. Formatos de Exportación

- **CSV**: Archivo de valores separados por comas
- **EXCEL**: Libro de Excel (.xlsx) con múltiples hojas
- **PDF**: Documento PDF (pendiente de implementación completa)

## Archivos Creados

### Enums
- `/src/reports/enums/report-type.enum.ts`
- `/src/reports/enums/report-frequency.enum.ts`
- `/src/reports/enums/report-format.enum.ts`

### Entidades
- `/src/reports/entities/scheduled-report.entity.ts`

### DTOs
- `/src/reports/dto/create-scheduled-report.dto.ts`
- `/src/reports/dto/update-scheduled-report.dto.ts`
- `/src/reports/dto/scheduled-report-response.dto.ts`

### Servicios
- `/src/reports/services/scheduled-reports.service.ts` - Servicio principal
- `/src/reports/services/reports-cron.service.ts` - Servicio de cron jobs

### Templates
- `/src/mail/templates/scheduled-report.hbs` - Template de email

### Migraciones
- `/src/database/migrations/1733480000000-CreateScheduledReportsTable.ts`

## Archivos Modificados

- `/src/reports/reports.module.ts` - Agregado ScheduledReportsService y ReportsCronService
- `/src/reports/reports.controller.ts` - Agregados endpoints de reportes programados
- `/src/queue/types/email-jobs.types.ts` - Agregado tipo SCHEDULED_REPORT
- `/src/queue/services/email-queue.service.ts` - Agregado método queueScheduledReportEmail
- `/src/i18n/es/reports.json` - Agregadas traducciones en español
- `/src/i18n/en/reports.json` - Agregadas traducciones en inglés

## API Endpoints

### POST /reports/scheduled
Crear un nuevo reporte programado

**Body:**
```json
{
  "name": "Reporte Diario de Inscripciones",
  "description": "Reporte automático de inscripciones del día",
  "eventId": "uuid-del-evento",
  "reportType": "DAILY_REGISTRATIONS",
  "frequency": "DAILY",
  "format": "EXCEL",
  "recipients": ["admin@example.com", "organizador@example.com"],
  "isActive": true,
  "config": {
    "scheduleTime": "08:00",
    "timezone": "America/Lima"
  }
}
```

### GET /reports/scheduled
Obtener todos los reportes programados
- Query param `eventId` (opcional): Filtrar por evento

### GET /reports/scheduled/:id
Obtener un reporte programado específico

### PUT /reports/scheduled/:id
Actualizar un reporte programado

### DELETE /reports/scheduled/:id
Eliminar un reporte programado

### POST /reports/scheduled/:id/send-now
Ejecutar manualmente un reporte programado (envío inmediato)

## Configuración de Reportes

### Configuración Diaria
```json
{
  "scheduleTime": "08:00",
  "timezone": "America/Lima"
}
```

### Configuración Semanal
```json
{
  "scheduleTime": "09:00",
  "weekDay": 1,
  "timezone": "America/Lima"
}
```
*Nota: weekDay: 0=Domingo, 1=Lunes, ..., 6=Sábado*

### Configuración Mensual
```json
{
  "scheduleTime": "10:00",
  "monthDay": 1,
  "timezone": "America/Lima"
}
```
*Nota: monthDay: 1-31*

## Cron Jobs

### Ejecución de Reportes Programados
- **Frecuencia**: Cada hora
- **Descripción**: Busca reportes cuya fecha de ejecución sea <= ahora y los ejecuta

### Verificación de Eventos Finalizados
- **Frecuencia**: Cada 6 horas
- **Descripción**: Verifica eventos que terminaron para ejecutar reportes ON_EVENT_END

### Limpieza de Reportes Antiguos
- **Frecuencia**: Diariamente a las 3 AM
- **Descripción**: Limpia reportes antiguos y desactiva aquellos con muchos fallos

## Características del Sistema

### Auto-desactivación por Fallos
- Si un reporte falla 5 veces consecutivas, se desactiva automáticamente
- El último error se guarda en el campo `lastError`
- Se puede reactivar manualmente después de corregir el problema

### Tracking de Ejecuciones
- `executionCount`: Contador de ejecuciones exitosas
- `failureCount`: Contador de fallos
- `lastSentAt`: Fecha de última ejecución exitosa
- `nextScheduledAt`: Próxima fecha de ejecución programada

### Validaciones
- Validación de formato de hora (HH:mm en formato 24h)
- Validación de día de la semana (0-6)
- Validación de día del mes (1-31)
- Validación de emails de destinatarios
- Validación de existencia del evento

## Estructura de la Entidad ScheduledReport

```typescript
{
  id: string;                    // UUID
  name: string;                  // Nombre del reporte
  description?: string;          // Descripción opcional
  event?: Event;                 // Evento asociado (nullable para reportes globales)
  reportType: ReportType;        // Tipo de reporte
  frequency: ReportFrequency;    // Frecuencia de ejecución
  format: ReportFormat;          // Formato de exportación
  recipients: string[];          // Lista de emails
  isActive: boolean;             // Si está activo
  lastSentAt?: Date;            // Última ejecución
  nextScheduledAt?: Date;       // Próxima ejecución
  executionCount: number;        // Contador de ejecuciones
  failureCount: number;          // Contador de fallos
  lastError?: string;           // Último error
  config?: object;              // Configuración adicional
  createdBy: User;              // Usuario creador
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;              // Fecha de actualización
}
```

## Template de Email

El template incluye:
- Header con título del reporte
- Detalles del reporte (tipo, frecuencia, formato, periodo)
- Resumen ejecutivo con estadísticas clave
- Indicación del archivo adjunto
- Información sobre próximo envío programado
- Link al dashboard (si está configurado)

## Ejemplo de Uso

### 1. Crear un Reporte Diario de Inscripciones

```bash
POST /reports/scheduled
{
  "name": "Inscripciones Diarias - Congreso 2024",
  "description": "Reporte automático enviado cada mañana",
  "eventId": "abc-123-def",
  "reportType": "DAILY_REGISTRATIONS",
  "frequency": "DAILY",
  "format": "EXCEL",
  "recipients": ["admin@cip.org.pe", "staff@cip.org.pe"],
  "config": {
    "scheduleTime": "07:00",
    "timezone": "America/Lima"
  }
}
```

### 2. Crear un Resumen Semanal

```bash
POST /reports/scheduled
{
  "name": "Resumen Semanal - Todos los Eventos",
  "reportType": "WEEKLY_SUMMARY",
  "frequency": "WEEKLY",
  "format": "EXCEL",
  "recipients": ["director@cip.org.pe"],
  "config": {
    "scheduleTime": "09:00",
    "weekDay": 1,
    "timezone": "America/Lima"
  }
}
```

### 3. Ejecutar Manualmente un Reporte

```bash
POST /reports/scheduled/abc-123/send-now
```

## Próximos Pasos (Opcional)

1. **Implementar procesamiento de email con adjuntos**:
   - Actualizar el worker de emails para manejar adjuntos
   - Configurar límites de tamaño de archivos

2. **Mejorar generación de PDFs**:
   - Integrar con el PdfService existente
   - Crear templates específicos para cada tipo de reporte

3. **Dashboard de Monitoreo**:
   - Vista de reportes programados
   - Historial de ejecuciones
   - Gráficas de estadísticas

4. **Notificaciones de Fallos**:
   - Enviar email al creador cuando un reporte falla
   - Webhook para integración con sistemas de monitoreo

5. **Reportes Personalizados**:
   - Permitir configurar columnas específicas
   - Filtros avanzados por usuario

## Notas Técnicas

- El cron service se ejecuta automáticamente al iniciar la aplicación
- Los reportes se ejecutan en background usando BullMQ
- Los archivos se generan en memoria y se envían directamente por email
- No se almacenan archivos en disco para evitar problemas de espacio
- El sistema es compatible con múltiples zonas horarias

## Testing

Para probar el sistema:

1. Crear un reporte programado con fecha inmediata
2. Esperar a que el cron lo ejecute (máximo 1 hora)
3. O ejecutarlo manualmente con `/send-now`
4. Verificar que llegue el email con el adjunto

## Migración de Base de Datos

Para aplicar la migración:

```bash
npm run migration:run
```

Para revertir:

```bash
npm run migration:revert
```

## Permisos Requeridos

Solo los usuarios con roles:
- `ORG_ADMIN`
- `SUPER_ADMIN`

Pueden crear, editar, eliminar y ejecutar reportes programados.
