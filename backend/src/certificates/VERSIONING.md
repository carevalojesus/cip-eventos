# Sistema de Versionado y Reemisión de Certificados

## Descripción General

El sistema ahora soporta versionado completo de certificados, permitiendo reemitir certificados cuando se corrigen datos (ej: nombre mal escrito) manteniendo el mismo código de validación.

## Características

- **Versionado automático**: Cada certificado comienza en versión 1 e incrementa con cada reemisión
- **Historial completo**: Se mantiene historial de todas las versiones con sus PDFs
- **Código inmutable**: El código de validación NUNCA cambia, solo se actualiza el PDF
- **Revocación**: Certificados pueden ser revocados por fraude o contracargos
- **Validación pública**: Endpoint público para verificar certificados sin autenticación
- **Auditoría**: Registro de quién y cuándo realizó cada operación

## Nuevos Campos en Certificate Entity

```typescript
version: number;                          // Versión actual (inicia en 1)
versionHistory: CertificateVersionHistory[]; // Historial de versiones
revokedAt: Date;                         // Fecha de revocación
revokedReason: string;                   // Motivo de revocación
revokedBy: User;                         // Usuario que revocó
lastReissuedAt: Date;                    // Última reemisión
lastReissuedBy: User;                    // Usuario que reemitió
```

## Endpoints

### 1. Reemitir Certificado

**POST** `/certificates/:id/reissue`

**Roles requeridos**: `ADMIN`, `SUPER_ADMIN`

**Body**:
```json
{
  "reason": "Corrección de nombre: Luiis → Luis"
}
```

**Respuesta**:
```json
{
  "id": "uuid",
  "validationCode": "CIP-2025-ABC123",
  "version": 2,
  "pdfUrl": "https://storage.../CERT-CIP-2025-ABC123.pdf",
  "lastReissuedAt": "2025-12-05T...",
  "versionHistory": [
    {
      "version": 1,
      "issuedAt": "2025-12-01T...",
      "pdfUrl": "https://storage.../old.pdf",
      "reason": "Corrección de nombre: Luiis → Luis"
    }
  ]
}
```

**Flujo**:
1. Valida que el certificado no esté revocado
2. Guarda la versión actual en `versionHistory`
3. Incrementa `version`
4. Obtiene datos actualizados de las entidades relacionadas (Person, Event, etc.)
5. Regenera PDF con datos correctos
6. Actualiza `pdfUrl`, `metadata`, `lastReissuedAt`, `lastReissuedBy`
7. El código de validación **NO cambia**

### 2. Revocar Certificado

**POST** `/certificates/:id/revoke`

**Roles requeridos**: `ADMIN`, `SUPER_ADMIN`

**Body**:
```json
{
  "reason": "Contracargo - Pago revertido"
}
```

**Respuesta**:
```json
{
  "id": "uuid",
  "status": "REVOKED",
  "revokedAt": "2025-12-05T...",
  "revokedReason": "Contracargo - Pago revertido",
  "revokedBy": {
    "id": "user-uuid",
    "email": "admin@example.com"
  }
}
```

### 3. Validar Certificado (Público)

**GET** `/certificates/validate/:code`

**Autenticación**: No requiere (endpoint público)

**Throttling**: 20 requests por minuto

**Ejemplo**: `/certificates/validate/CIP-2025-ABC123`

**Respuesta - Certificado Válido**:
```json
{
  "isValid": true,
  "status": "ACTIVE",
  "message": "Certificado válido",
  "certificate": {
    "type": "ATTENDANCE",
    "recipientName": "Juan Pérez García",
    "eventName": "Congreso Internacional de Pediatría 2025",
    "eventDate": "15/03/2025",
    "hours": 8,
    "issuedAt": "2025-03-20T...",
    "version": 2
  }
}
```

**Respuesta - Certificado Revocado**:
```json
{
  "isValid": false,
  "status": "REVOKED",
  "message": "Certificado revocado. Motivo: Contracargo - Pago revertido",
  "revocationInfo": {
    "revokedAt": "2025-12-05T...",
    "reason": "Contracargo - Pago revertido"
  }
}
```

**Respuesta - Certificado No Encontrado**:
```json
{
  "isValid": false,
  "status": "EXPIRED",
  "message": "Certificado no encontrado"
}
```

### 4. Obtener Historial de Versiones

**GET** `/certificates/:id/versions`

**Roles requeridos**: `ADMIN`, `SUPER_ADMIN`

**Respuesta**:
```json
[
  {
    "version": 1,
    "issuedAt": "2025-03-20T...",
    "pdfUrl": "https://storage.../version-1.pdf",
    "metadata": { ... },
    "reason": "Corrección de nombre"
  },
  {
    "version": 2,
    "issuedAt": "2025-12-05T...",
    "pdfUrl": "https://storage.../version-2.pdf",
    "metadata": { ... },
    "reason": "Versión actual"
  }
]
```

### 5. Reemisión Masiva

**POST** `/certificates/bulk-reissue`

**Roles requeridos**: `ADMIN`, `SUPER_ADMIN`

**Body**:
```json
{
  "certificateIds": [
    "cert-uuid-1",
    "cert-uuid-2",
    "cert-uuid-3"
  ],
  "reason": "Fusión de registros de persona duplicada"
}
```

**Respuesta**:
```json
{
  "total": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "certificateId": "cert-uuid-1",
      "success": true,
      "newVersion": 2
    },
    {
      "certificateId": "cert-uuid-2",
      "success": true,
      "newVersion": 3
    },
    {
      "certificateId": "cert-uuid-3",
      "success": false,
      "error": "Certificate is already revoked"
    }
  ]
}
```

## Casos de Uso

### Caso 1: Corrección de Nombre

**Escenario**: Un asistente reporta que su nombre está mal escrito: "Luiis" en lugar de "Luis"

**Pasos**:
1. Admin corrige el nombre en la entidad `Person` o `Attendee`
2. Admin llama a `POST /certificates/:id/reissue` con `reason: "Corrección de nombre"`
3. Sistema regenera PDF con datos correctos
4. El código QR sigue apuntando al mismo código de validación
5. Al escanear el QR, se muestra el certificado con el nombre correcto

### Caso 2: Fusión de Personas Duplicadas

**Escenario**: Se detectó que "Juan Pérez" y "J. Pérez" son la misma persona. Se fusionan los registros.

**Pasos**:
1. Admin fusiona las entidades `Person` (operación separada)
2. Admin obtiene lista de certificados afectados
3. Admin llama a `POST /certificates/bulk-reissue` con todos los IDs
4. Sistema reemite todos los certificados con datos unificados

### Caso 3: Contracargo / Fraude

**Escenario**: Se detecta un pago fraudulento o el banco revirtió el cargo

**Pasos**:
1. Admin llama a `POST /certificates/:id/revoke` con `reason: "Contracargo"`
2. Sistema marca el certificado como `REVOKED`
3. Al validar el código, retorna `isValid: false` con motivo de revocación
4. No se puede reemitir un certificado revocado (se debe crear uno nuevo si aplica)

## Integración con Frontend

### Página de Validación Pública

```typescript
// components/CertificateValidator.tsx

const validateCertificate = async (code: string) => {
  const response = await fetch(`/api/certificates/validate/${code}`);
  const data = await response.json();

  if (data.isValid) {
    // Mostrar certificado válido con badge verde
    // Mostrar todos los datos: recipientName, eventName, etc.
    // Mostrar versión si > 1
  } else if (data.status === 'REVOKED') {
    // Mostrar alerta roja: Certificado revocado
    // Mostrar motivo de revocación
  } else {
    // Mostrar: Certificado no encontrado o expirado
  }
};
```

### Panel de Administración

```typescript
// Admin puede:
// 1. Ver historial de versiones de un certificado
// 2. Reemitir certificado con un botón "Reemitir"
// 3. Revocar certificado con confirmación
// 4. Ver quién y cuándo realizó cada operación

const reissueCertificate = async (certId: string) => {
  const reason = prompt("Motivo de reemisión:");
  const response = await fetch(`/api/certificates/${certId}/reissue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });

  if (response.ok) {
    toast.success('Certificado reemitido exitosamente');
  }
};
```

## Consideraciones de Seguridad

1. **Endpoint de Validación Público**:
   - Implementa throttling (20 req/min)
   - No expone información sensible del usuario
   - Solo retorna datos del certificado

2. **Inmutabilidad del Código**:
   - El código de validación NUNCA cambia
   - Previene fraude por generación de nuevos códigos

3. **Auditoría**:
   - Se registra quién realizó cada reemisión/revocación
   - Se mantiene historial completo con motivos

4. **Revocación Irreversible**:
   - No se puede "desrevocar" un certificado
   - Si se revocó por error, se debe crear uno nuevo

## Migración

La migración `1733430000000-AddCertificateVersioningFields.ts` agrega:

- `version` (int, default: 1)
- `versionHistory` (jsonb, nullable)
- `revokedAt` (timestamp, nullable)
- `revokedReason` (text, nullable)
- `revokedById` (uuid, nullable) → FK a `users`
- `lastReissuedAt` (timestamp, nullable)
- `lastReissuedById` (uuid, nullable) → FK a `users`

**Para ejecutar**:
```bash
npm run migration:run
```

## Mejoras Futuras

- [ ] Notificación por email cuando se reemite un certificado
- [ ] Dashboard con métricas de reemisiones/revocaciones
- [ ] API para descarga de versiones anteriores del PDF
- [ ] Integración con blockchain para registro inmutable
- [ ] Webhook para notificar a sistemas externos cuando se revoca un certificado
