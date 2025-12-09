# Reports Module

Sistema de reportes exportables para CIP Eventos con soporte para CSV, Excel (XLSX) y PDF.

## Estructura del Módulo

```
src/reports/
├── dto/
│   ├── report-filter.dto.ts          # Filtros comunes (eventId, dateFrom, dateTo)
│   ├── registration-report.dto.ts    # DTOs para reportes de inscripciones
│   ├── financial-report.dto.ts       # DTOs para reportes financieros
│   └── academic-report.dto.ts        # DTOs para reportes académicos
├── interfaces/
│   └── export.interface.ts           # Interfaces para exportación (ColumnConfig, ExcelSheet)
├── services/
│   ├── export.service.ts             # Servicio de exportación (CSV/Excel/PDF)
│   ├── registration-reports.service.ts  # Reportes de inscripciones
│   ├── financial-reports.service.ts     # Reportes financieros
│   └── academic-reports.service.ts      # Reportes académicos
├── reports.controller.ts             # Controlador con endpoints REST
├── reports.service.ts                # Servicio orquestador principal
└── reports.module.ts                 # Módulo de NestJS
```

## Características

### Formatos de Exportación
- **CSV**: Formato simple para importar en Excel u otras herramientas
- **XLSX**: Excel nativo con múltiples hojas, formato de celdas y auto-filtros
- **PDF**: Pendiente de implementar (puede integrar con PdfService existente)

### Tipos de Reportes

#### 1. Reportes de Inscripciones (ORG_ADMIN)
- Total de inscritos por tipo de entrada
- Inscritos por estado (confirmados, pendientes, cancelados)
- Inscritos por rol (asistente, ponente, staff)
- Asistencia por sesión (presencial y virtual)
- Certificados emitidos vs descargados
- Tasa de conversión (visitas → inscripciones → pagos)

#### 2. Reportes Financieros (ORG_FINANZAS)
- Recaudación por evento, tipo de entrada y bloque
- Pagos por método de pago (Yape, Plin, PayPal, etc.)
- Comprobantes emitidos vs anulados
- Reembolsos y notas de crédito
- Conciliación con pasarela (placeholder)

#### 3. Reportes Académicos (ORG_STAFF_ACADEMICO)
- Listados de participantes aptos/no aptos para certificados
- Distribución de notas por bloque evaluable
- Reportes de asistencia detallada
- Estadísticas de calificaciones (promedio, mediana, desviación estándar)

## Endpoints Principales

### Inscripciones

```bash
# Obtener reporte de inscripciones (JSON)
GET /reports/events/:eventId/registrations

# Exportar inscripciones a CSV/Excel
GET /reports/events/:eventId/registrations/export?format=xlsx

# Reporte de asistencia por sesión
GET /reports/events/:eventId/attendance-by-session

# Exportar asistencia por sesión
GET /reports/events/:eventId/attendance-by-session/export?format=csv

# Estadísticas de certificados
GET /reports/events/:eventId/certificates
```

### Financieros

```bash
# Reporte de recaudación
GET /reports/events/:eventId/revenue

# Exportar recaudación
GET /reports/events/:eventId/revenue/export?format=xlsx

# Reportes de pagos por método
GET /reports/events/:eventId/payments
GET /reports/events/:eventId/payments/export?format=csv

# Reporte de comprobantes fiscales
GET /reports/events/:eventId/fiscal-documents

# Reporte de reembolsos
GET /reports/events/:eventId/refunds
GET /reports/events/:eventId/refunds/export?format=xlsx
```

### Académicos

```bash
# Estado de aprobación (aptos para certificado)
GET /reports/blocks/:blockId/approval-status
GET /reports/blocks/:blockId/approval-status/export?format=xlsx

# Distribución de notas
GET /reports/blocks/:blockId/grades

# Asistencia detallada
GET /reports/blocks/:blockId/attendance
GET /reports/blocks/:blockId/attendance/export?format=csv
```

### Reporte Completo

```bash
# Exportar reporte completo del evento (todas las hojas en un Excel)
GET /reports/events/:eventId/full-report/export
```

## Permisos por Rol

| Reporte | ORG_ADMIN | ORG_FINANZAS | ORG_STAFF_ACADEMICO | SUPER_ADMIN |
|---------|-----------|--------------|---------------------|-------------|
| Inscripciones | ✅ | ❌ | ❌ | ✅ |
| Financieros | ✅ | ✅ | ❌ | ✅ |
| Académicos | ✅ | ❌ | ✅ | ✅ |
| Reporte completo | ✅ | ❌ | ❌ | ✅ |

## Uso del ExportService

El `ExportService` puede utilizarse independientemente para exportar cualquier dato:

```typescript
import { ExportService } from './reports/services/export.service';

// CSV
const csvBuffer = await exportService.toCsv(data, columns);

// Excel con múltiples hojas
const excelBuffer = await exportService.toExcel([
  { name: 'Hoja 1', data: data1, columns: columns1 },
  { name: 'Hoja 2', data: data2, columns: columns2 },
]);

// Configuración de columnas
const columns: ColumnConfig[] = [
  { key: 'name', header: 'Nombre', width: 30 },
  { key: 'price', header: 'Precio', width: 15, format: 'currency' },
  { key: 'date', header: 'Fecha', width: 20, format: 'date' },
  { key: 'percentage', header: 'Porcentaje', width: 15, format: 'percentage' },
];
```

### Formatos de Columna Disponibles
- `text`: Texto plano (por defecto)
- `number`: Número con separadores de miles
- `currency`: Moneda (S/. ##,###.##)
- `date`: Fecha (dd/mm/yyyy)
- `datetime`: Fecha y hora (dd/mm/yyyy hh:mm:ss)
- `percentage`: Porcentaje (##.##%)

## Optimizaciones

### Queries Eficientes
- Uso de índices en columnas de filtrado frecuente
- JOINs optimizados con eager loading solo cuando es necesario
- Paginación en endpoints JSON (no en exports completos)

### Manejo de Grandes Volúmenes
- Los reportes JSON soportan paginación
- Las exportaciones cargan todos los datos (sin paginación)
- Se recomienda agregar límites de tiempo para reportes muy grandes

### Cache
El módulo podría integrar con RedisService para cachear reportes generados recientemente:

```typescript
const cacheKey = `report:${eventId}:registrations`;
const cached = await redisService.get(cacheKey);
if (cached) return cached;

const report = await generateReport();
await redisService.set(cacheKey, report, TTL);
```

## Internacionalización

El módulo soporta i18n para nombres de columnas y mensajes:

```json
// src/i18n/es/reports.json
{
  "columns": {
    "attendeeName": "Nombre",
    "finalPrice": "Precio Final",
    ...
  }
}
```

Los reportes se generan en el idioma del contexto actual (español o inglés).

## Dependencias

```json
{
  "exceljs": "^4.4.0",      // Generación de archivos Excel
  "json2csv": "^6.0.0"       // Generación de archivos CSV
}
```

## Próximas Mejoras

- [ ] Implementar generación de PDF con tablas
- [ ] Agregar gráficos en archivos Excel
- [ ] Implementar cache de reportes con Redis
- [ ] Agregar reportes programados (cron jobs)
- [ ] Notificaciones por email cuando un reporte grande esté listo
- [ ] Integración real con APIs de pasarelas para conciliación
- [ ] Reportes personalizados (usuarios pueden elegir columnas)
- [ ] Dashboard de visualización de reportes (gráficos)

## Testing

Para probar los endpoints:

```bash
# Obtener reporte JSON
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/reports/events/EVENT_ID/registrations

# Descargar Excel
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/reports/events/EVENT_ID/registrations/export?format=xlsx \
  --output registrations.xlsx

# Descargar CSV
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/reports/events/EVENT_ID/revenue/export?format=csv \
  --output revenue.csv
```

## Notas de Seguridad

- Todos los endpoints requieren autenticación (JwtAuthGuard)
- Permisos basados en roles (RolesGuard)
- Validación de parámetros con class-validator
- Los datos sensibles no se exponen en reportes públicos
