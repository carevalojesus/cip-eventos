# Módulo de Certificados - Sistema de Versionado y Reemisión

## Descripción

Este módulo gestiona la emisión, validación, reemisión y revocación de certificados digitales para eventos. Soporta diferentes tipos de certificados: asistencia, ponentes, organizadores y aprobación de cursos/talleres.

## Características Principales

### Emisión de Certificados
- Emisión individual y masiva
- Generación automática de PDFs con plantillas Handlebars
- Códigos de validación únicos e inmutables
- QR codes para verificación rápida
- Soporte para múltiples firmantes

### Versionado y Reemisión (NUEVO)
- Sistema de versiones automático (v1, v2, v3...)
- Reemisión cuando se corrigen datos (mantiene mismo código)
- Historial completo de todas las versiones
- PDFs históricos accesibles
- Registro de motivo de cada reemisión

### Revocación
- Revocación de certificados por fraude/contracargo
- Registro de motivo y responsable
- Irreversible (no se puede "desrevocar")

### Validación Pública
- Endpoint público sin autenticación
- Validación por código o QR
- Respuesta detallada del estado del certificado
- Throttling para prevenir abuso (20 req/min)

## Tipos de Certificados

```typescript
enum CertificateType {
  ATTENDANCE = 'ATTENDANCE',   // Asistencia a evento
  SPEAKER = 'SPEAKER',         // Ponente/expositor
  ORGANIZER = 'ORGANIZER',     // Organizador
  APPROVAL = 'APPROVAL',       // Aprobación de curso/taller evaluable
}
```

## Estados de Certificados

```typescript
enum CertificateStatus {
  ACTIVE = 'ACTIVE',     // Certificado válido
  REVOKED = 'REVOKED',   // Revocado por admin
  EXPIRED = 'EXPIRED',   // Expirado (futuro)
}
```

## Estructura de Archivos

```
certificates/
├── entities/
│   └── certificate.entity.ts          # Entidad principal con versionado
├── dto/
│   ├── create-certificate.dto.ts      # Crear certificado
│   ├── update-certificate.dto.ts      # Actualizar certificado
│   ├── reissue-certificate.dto.ts     # Reemitir (nuevo)
│   ├── revoke-certificate.dto.ts      # Revocar (nuevo)
│   ├── bulk-reissue-certificate.dto.ts # Reemisión masiva (nuevo)
│   ├── certificate-validation.dto.ts  # Respuesta de validación (nuevo)
│   └── bulk-reissue-result.dto.ts     # Resultado masivo (nuevo)
├── certificates.controller.ts         # Endpoints HTTP
├── certificates.service.ts            # Lógica de negocio
├── certificates.module.ts             # Configuración del módulo
├── templates/
│   └── certificates/
│       └── base-certificate.hbs       # Plantilla HTML/CSS del PDF
├── API.md                             # Documentación de endpoints
├── VERSIONING.md                      # Guía de versionado
├── EXAMPLES.md                        # Ejemplos de código
└── README.md                          # Este archivo
```

## Uso Rápido

### 1. Emitir Certificados de Asistencia (Masivo)

```bash
POST /api/certificates/issue-batch/:eventId
```

Emite certificados automáticamente para todos los asistentes que:
- Tienen status `CONFIRMED`
- Marcaron asistencia (`attended: true`)
- No tienen certificado previo

### 2. Corregir un Dato y Reemitir

**Escenario**: El nombre del asistente está mal escrito

```typescript
// 1. Corregir en la base de datos
await attendeeRepository.update(attendeeId, {
  firstName: 'Luis' // antes: 'Luiis'
});

// 2. Reemitir certificado
POST /api/certificates/{cert-id}/reissue
Body: { "reason": "Corrección de nombre: Luiis → Luis" }

// 3. El sistema automáticamente:
//    - Guarda versión anterior en historial
//    - Incrementa version de 1 a 2
//    - Obtiene datos frescos (Luis)
//    - Regenera PDF
//    - Mantiene el mismo validationCode
```

### 3. Validar un Certificado (Público)

```bash
GET /api/certificates/validate/CIP-2025-ABC123
```

No requiere autenticación. Retorna:
- Si es válido: datos completos + versión
- Si está revocado: motivo y fecha
- Si no existe: mensaje de error

### 4. Revocar un Certificado

```bash
POST /api/certificates/{cert-id}/revoke
Body: { "reason": "Contracargo - Pago revertido" }
```

El certificado pasa a estado `REVOKED` y no puede ser reemitido.

## Integración con Otros Módulos

### Con Persons (Fusión de Duplicados)

Cuando se fusionan dos registros de persona:

```typescript
// 1. Fusionar personas
const keptPerson = await personsService.merge(duplicateId, targetId);

// 2. Obtener certificados afectados
const certs = await certificatesRepository.find({
  where: { registration: { attendee: { id: duplicateId } } }
});

// 3. Reemitir todos
await certificatesService.bulkReissue(
  certs.map(c => c.id),
  'Fusión de personas duplicadas',
  currentUser
);
```

### Con Evaluaciones (Aprobación de Cursos)

Cuando un participante aprueba un curso/taller:

```typescript
// En el servicio de evaluaciones, después de calcular nota final
if (enrollment.status === BlockEnrollmentStatus.APPROVED) {
  await certificatesService.issueApprovalCertificate(enrollment.id);
}
```

### Con QR Scanner (App Móvil)

```typescript
// App escanea QR que contiene: "CIP-2025-ABC123"
const result = await fetch(`/api/certificates/validate/${qrCode}`);

if (result.isValid) {
  showSuccess(result.certificate);
} else if (result.status === 'REVOKED') {
  showWarning(`Revocado: ${result.revocationInfo.reason}`);
} else {
  showError('Certificado no válido');
}
```

## Campos Clave de Certificate Entity

```typescript
@Entity('certificates')
export class Certificate {
  // Identificación
  id: string;
  validationCode: string;              // ÚNICO, INMUTABLE (ej: "CIP-2025-ABC123")

  // Tipo y estado
  type: CertificateType;
  status: CertificateStatus;

  // Versionado (NUEVO)
  version: number;                     // Default: 1, incrementa con cada reemisión
  versionHistory: CertificateVersionHistory[]; // Array de versiones anteriores
  lastReissuedAt: Date;
  lastReissuedBy: User;

  // Revocación (NUEVO)
  revokedAt: Date;
  revokedReason: string;
  revokedBy: User;

  // Datos del certificado
  pdfUrl: string;                      // URL del PDF en storage
  metadata: {                          // Snapshot de datos al emitir
    recipientName: string;
    eventName: string;
    eventDate: string;
    hours: number;
    // ... más campos
  };

  // Relaciones (polimórficas)
  event: Event;
  registration: Registration;          // Si es asistente
  speaker: Speaker;                    // Si es ponente
  user: User;                          // Si es organizador
  blockEnrollment: BlockEnrollment;    // Si es aprobación de curso

  // Timestamps
  issuedAt: Date;
  updatedAt: Date;
}
```

## Seguridad

### Control de Acceso

- **Emisión**: Solo `ADMIN` y `SUPER_ADMIN`
- **Reemisión**: Solo `ADMIN` y `SUPER_ADMIN`
- **Revocación**: Solo `ADMIN` y `SUPER_ADMIN`
- **Validación**: Público (sin autenticación)
- **Historial**: Solo `ADMIN` y `SUPER_ADMIN`

### Rate Limiting

- Endpoint de validación: 20 requests/min
- Endpoint de verificación legacy: 10 requests/min

### Auditoría

Cada operación registra:
- Quién la realizó (`lastReissuedBy`, `revokedBy`)
- Cuándo (`lastReissuedAt`, `revokedAt`)
- Por qué (campo `reason` en DTOs)

## Migración de Base de Datos

### Ejecutar Migración

```bash
cd backend
npm run migration:run
```

### Migración: AddCertificateVersioningFields

Agrega los siguientes campos a la tabla `certificates`:

- `version` (int, default: 1)
- `versionHistory` (jsonb)
- `revokedAt` (timestamp)
- `revokedReason` (text)
- `revokedById` (uuid, FK a users)
- `lastReissuedAt` (timestamp)
- `lastReissuedById` (uuid, FK a users)

**Nota**: Certificados existentes automáticamente tendrán `version = 1`.

## Testing

### Ejecutar Tests

```bash
npm run test certificates.service
```

### Tests Clave

- ✅ Reemisión incrementa versión
- ✅ No se puede reemitir certificado revocado
- ✅ Historial se guarda correctamente
- ✅ Código de validación no cambia
- ✅ Validación retorna estado correcto
- ✅ Bulk reissue procesa todos los certificados

## Archivos de Referencia

- **[API.md](./API.md)**: Documentación completa de todos los endpoints
- **[VERSIONING.md](./VERSIONING.md)**: Guía detallada del sistema de versionado
- **[EXAMPLES.md](./EXAMPLES.md)**: Ejemplos de código y casos de uso

## Mejoras Futuras

- [ ] Notificación por email cuando se reemite un certificado
- [ ] Dashboard de analíticas (reemisiones, revocaciones)
- [ ] Exportar versiones antiguas de PDFs
- [ ] Firma digital con blockchain
- [ ] API de webhooks para notificar sistemas externos
- [ ] Soporte para certificados con fecha de expiración automática
- [ ] Certificados NFT (opcional)

## Soporte

Para preguntas o issues, contactar al equipo de desarrollo.

## Changelog

### v2.0.0 (2025-12-05)
- ✨ Sistema de versionado automático
- ✨ Reemisión de certificados con datos actualizados
- ✨ Revocación de certificados
- ✨ Endpoint público de validación mejorado
- ✨ Historial completo de versiones
- ✨ Reemisión masiva (bulk)
- 📝 Documentación completa (API.md, VERSIONING.md, EXAMPLES.md)

### v1.0.0 (2024)
- 🎉 Emisión de certificados de asistencia
- 🎉 Emisión de certificados de aprobación
- 🎉 Generación de PDFs con Puppeteer
- 🎉 Códigos de validación únicos
- 🎉 QR codes para verificación
