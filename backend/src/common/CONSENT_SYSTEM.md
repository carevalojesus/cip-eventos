# Sistema de Registro de Consentimientos (ConsentLog)

## Descripción General

El sistema de registro de consentimientos permite rastrear y gestionar las aceptaciones de políticas legales (Términos y Condiciones, Política de Privacidad, Marketing, etc.) por parte de usuarios y personas en el sistema.

## Características Principales

- Registro de múltiples tipos de consentimiento
- Versionado de documentos legales
- Histórico completo de aceptaciones y revocaciones
- Captura de metadata (IP, User-Agent, contexto)
- Vinculación con Person o User
- Validación de consentimientos requeridos
- API RESTful completa

## Estructura de Datos

### Entidad ConsentLog

Ubicación: `/src/common/entities/consent-log.entity.ts`

```typescript
{
  id: uuid,
  personId: uuid (nullable),
  userId: uuid (nullable),
  consentType: ConsentType,
  documentVersion: string,
  ipAddress: string (nullable),
  userAgent: string (nullable),
  acceptedAt: Date,
  revokedAt: Date (nullable),
  revokeReason: string (nullable),
  revokedById: uuid (nullable),
  metadata: jsonb (nullable),
  createdAt: Date
}
```

### Tipos de Consentimiento (ConsentType Enum)

```typescript
enum ConsentType {
  TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  MARKETING = 'MARKETING',
  DATA_PROCESSING = 'DATA_PROCESSING',
}
```

## Versiones de Documentos

Las versiones actuales se configuran en el ConsentService:

```typescript
TERMS_AND_CONDITIONS: 'v2.1'
PRIVACY_POLICY: 'v2.0'
MARKETING: 'v1.0'
DATA_PROCESSING: 'v1.5'
```

También pueden configurarse mediante variables de entorno:
- `CONSENT_VERSION_TERMS_AND_CONDITIONS`
- `CONSENT_VERSION_PRIVACY_POLICY`
- etc.

## API Endpoints

### 1. Registrar Consentimiento

**POST** `/consent/accept`

Endpoint público para registrar un consentimiento individual.

**Body:**
```json
{
  "personId": "uuid (opcional)",
  "userId": "uuid (opcional)",
  "consentType": "TERMS_AND_CONDITIONS",
  "documentVersion": "v2.1",
  "ipAddress": "192.168.1.1 (opcional - se captura automáticamente)",
  "userAgent": "Mozilla/5.0... (opcional - se captura automáticamente)",
  "metadata": {
    "source": "registration_form",
    "platform": "web"
  }
}
```

**Response:**
```json
{
  "message": "Consentimiento registrado exitosamente",
  "consent": {
    "id": "uuid",
    "consentType": "TERMS_AND_CONDITIONS",
    "documentVersion": "v2.1",
    "acceptedAt": "2025-12-06T10:30:00Z"
  }
}
```

### 2. Registrar Múltiples Consentimientos

**POST** `/consent/accept-bulk`

Útil para el proceso de registro donde se aceptan múltiples términos a la vez.

**Body:**
```json
{
  "userId": "uuid",
  "consents": [
    {
      "consentType": "TERMS_AND_CONDITIONS",
      "documentVersion": "v2.1"
    },
    {
      "consentType": "PRIVACY_POLICY",
      "documentVersion": "v2.0"
    }
  ],
  "ipAddress": "192.168.1.1 (opcional)",
  "userAgent": "Mozilla/5.0... (opcional)"
}
```

**Response:**
```json
{
  "message": "2 consentimiento(s) registrado(s) exitosamente",
  "count": 2,
  "consents": [...]
}
```

### 3. Revocar Consentimiento

**POST** `/consent/revoke` (requiere autenticación)

**Body:**
```json
{
  "consentId": "uuid",
  "reason": "Usuario solicitó eliminar su consentimiento"
}
```

**Response:**
```json
{
  "message": "Consentimiento revocado exitosamente",
  "consent": {
    "id": "uuid",
    "consentType": "MARKETING",
    "revokedAt": "2025-12-06T10:35:00Z",
    "revokeReason": "Usuario solicitó eliminar su consentimiento"
  }
}
```

### 4. Obtener Historial de Consentimientos

**GET** `/consent/history?userId=uuid&consentType=TERMS_AND_CONDITIONS&includeRevoked=true`
(requiere autenticación)

**Query Params:**
- `personId` (opcional): ID de la persona
- `userId` (opcional): ID del usuario
- `consentType` (opcional): Filtrar por tipo específico
- `includeRevoked` (opcional, default: true): Incluir consentimientos revocados

**Response:**
```json
{
  "count": 3,
  "consents": [
    {
      "id": "uuid",
      "consentType": "TERMS_AND_CONDITIONS",
      "documentVersion": "v2.1",
      "acceptedAt": "2025-12-06T10:30:00Z",
      "revokedAt": null,
      "revokeReason": null,
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": { "source": "registration" }
    }
  ]
}
```

### 5. Verificar Estado de Consentimiento

**GET** `/consent/status/:consentType?userId=uuid`

Endpoint público para verificar si un usuario tiene un consentimiento válido.

**Response:**
```json
{
  "consentType": "TERMS_AND_CONDITIONS",
  "hasValidConsent": true,
  "currentVersion": "v2.1",
  "acceptedVersion": "v2.0",
  "acceptedAt": "2025-11-01T10:00:00Z",
  "needsUpdate": true
}
```

### 6. Obtener Mis Consentimientos Activos

**GET** `/consent/my-consents` (requiere autenticación)

Retorna todos los consentimientos activos del usuario autenticado.

**Response:**
```json
{
  "count": 2,
  "consents": [
    {
      "id": "uuid",
      "consentType": "TERMS_AND_CONDITIONS",
      "documentVersion": "v2.1",
      "acceptedAt": "2025-12-06T10:30:00Z",
      "currentVersion": "v2.1",
      "needsUpdate": false
    }
  ]
}
```

### 7. Validar Consentimientos Requeridos

**POST** `/consent/validate-required?userId=uuid` (requiere autenticación)

Verifica que el usuario tenga todos los consentimientos obligatorios (TERMS_AND_CONDITIONS y PRIVACY_POLICY).

**Response:**
```json
{
  "valid": false,
  "missing": ["PRIVACY_POLICY"],
  "message": "Faltan 1 consentimiento(s) requerido(s)"
}
```

### 8. Revocar Todos los Consentimientos

**POST** `/consent/revoke-all?userId=uuid&reason=Account deletion` (requiere autenticación)

Útil para eliminación de cuenta o solicitud GDPR de olvido.

**Response:**
```json
{
  "message": "3 consentimiento(s) revocado(s) exitosamente",
  "count": 3
}
```

### 9. Obtener Versiones de Documentos

**GET** `/consent/versions`

Endpoint público que retorna las versiones actuales de todos los documentos.

**Response:**
```json
{
  "versions": {
    "TERMS_AND_CONDITIONS": "v2.1",
    "PRIVACY_POLICY": "v2.0",
    "MARKETING": "v1.0",
    "DATA_PROCESSING": "v1.5"
  }
}
```

## Integración con Registro de Usuario

El sistema está integrado automáticamente en el flujo de registro (`/auth/register`).

### RegisterAuthDto Actualizado

```typescript
{
  email: string,
  password: string,
  acceptTerms: boolean,           // Obligatorio
  acceptPrivacy: boolean,          // Obligatorio
  acceptMarketing?: boolean,       // Opcional
  acceptDataProcessing?: boolean,  // Opcional
  termsVersion?: string,           // Opcional (usa versión actual si no se provee)
  privacyVersion?: string          // Opcional (usa versión actual si no se provee)
}
```

### Validación en Registro

El sistema valida automáticamente que `acceptTerms` y `acceptPrivacy` sean `true` antes de crear la cuenta. Si faltan, retorna error 400:

```json
{
  "message": "La aceptación de los Términos y Condiciones y la Política de Privacidad es requerida para el registro"
}
```

### Registro Automático de Consentimientos

Al registrarse exitosamente, el sistema:

1. Crea el usuario
2. Registra automáticamente todos los consentimientos aceptados
3. Captura IP y User-Agent
4. Guarda metadata con contexto de origen

```javascript
// Ejemplo de metadata guardada
{
  source: 'registration',
  userId: 'uuid-del-usuario-creado'
}
```

## Métodos del ConsentService

### recordConsent(dto: RecordConsentDto): Promise<ConsentLog>
Registra un consentimiento individual.

### recordBulkConsents(personId, userId, consents[], ipAddress, userAgent): Promise<ConsentLog[]>
Registra múltiples consentimientos en una sola operación.

### revokeConsent(dto: RevokeConsentDto, revokedByUserId): Promise<ConsentLog>
Revoca un consentimiento específico.

### getConsentHistory(query: ConsentHistoryQueryDto): Promise<ConsentLog[]>
Obtiene el historial completo de consentimientos.

### hasValidConsent(personId, userId, consentType): Promise<boolean>
Verifica si existe un consentimiento válido (no revocado).

### getActiveConsent(personId, userId, consentType): Promise<ConsentLog | null>
Obtiene el consentimiento activo más reciente.

### getConsentStatus(personId, userId, consentType): Promise<ConsentStatusDto>
Obtiene el estado detallado de un consentimiento (incluye si necesita actualización).

### getCurrentDocumentVersion(consentType): string
Retorna la versión actual del documento.

### validateRequiredConsents(personId, userId): Promise<{valid: boolean, missing: ConsentType[]}>
Valida que estén presentes los consentimientos obligatorios.

### getActiveConsents(personId, userId): Promise<ConsentLog[]>
Obtiene todos los consentimientos activos.

### revokeAllConsents(personId, userId, reason, revokedByUserId): Promise<number>
Revoca todos los consentimientos activos.

## Base de Datos

### Migración

Ubicación: `/src/database/migrations/1733490000000-AddConsentLogsTable.ts`

Para ejecutar la migración:

```bash
npm run migration:run
```

### Índices Creados

- `IDX_consent_logs_person_consentType` - Para búsquedas por persona y tipo
- `IDX_consent_logs_user_consentType` - Para búsquedas por usuario y tipo
- `IDX_consent_logs_consentType_revokedAt` - Para filtrar revocados
- `IDX_consent_logs_acceptedAt` - Para ordenar por fecha
- `IDX_consent_logs_active` - Para búsquedas de consentimientos activos (optimización)

### Constraints

- `CHK_consent_logs_person_or_user` - Asegura que al menos personId o userId esté presente
- Foreign keys a `persons`, `users` con CASCADE DELETE

## Ejemplo de Uso Completo

### 1. Frontend - Formulario de Registro

```typescript
// React/Vue/Angular
const handleRegister = async () => {
  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'usuario@example.com',
      password: 'Password123',
      acceptTerms: true,        // Usuario marcó checkbox
      acceptPrivacy: true,       // Usuario marcó checkbox
      acceptMarketing: false,    // Usuario NO marcó checkbox
      // termsVersion y privacyVersion se auto-detectan si no se envían
    })
  });

  const data = await response.json();
  // data.access_token disponible
};
```

### 2. Verificar Estado Antes de una Acción

```typescript
// Antes de permitir una acción sensible, verificar consentimiento
const checkConsent = async (userId) => {
  const response = await fetch(
    `/consent/status/TERMS_AND_CONDITIONS?userId=${userId}`
  );
  const status = await response.json();

  if (!status.hasValidConsent) {
    // Mostrar modal solicitando aceptar términos
    showConsentModal();
  } else if (status.needsUpdate) {
    // Términos actualizados, pedir re-aceptación
    showUpdatedTermsModal(status.currentVersion);
  }
};
```

### 3. Revocar Consentimiento de Marketing

```typescript
// Usuario quiere dejar de recibir emails de marketing
const unsubscribeMarketing = async (token) => {
  const consents = await fetch('/consent/my-consents', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  const marketingConsent = consents.consents.find(
    c => c.consentType === 'MARKETING'
  );

  if (marketingConsent) {
    await fetch('/consent/revoke', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        consentId: marketingConsent.id,
        reason: 'User unsubscribed from marketing emails'
      })
    });
  }
};
```

### 4. Auditoría y Cumplimiento GDPR

```typescript
// Generar reporte de consentimientos para auditoría
const generateConsentReport = async (userId) => {
  const history = await fetch(
    `/consent/history?userId=${userId}&includeRevoked=true`,
    { headers: { 'Authorization': `Bearer ${adminToken}` }}
  ).then(r => r.json());

  // history.consents contiene registro completo con IPs, fechas, versiones
  return generatePDFReport(history.consents);
};
```

## Internacionalización (i18n)

El sistema soporta mensajes en español e inglés.

### Archivos de Traducción

- `/src/i18n/en/consent.json`
- `/src/i18n/es/consent.json`

### Mensajes Disponibles

- `person_or_user_required`
- `not_found`
- `already_revoked`
- `recorded_successfully`
- `bulk_recorded_successfully`
- `revoked_successfully`
- `all_required_present`
- `missing_required`
- `required_for_registration`
- etc.

## Mejores Prácticas

### 1. Capturar Metadata Relevante

```typescript
await consentService.recordConsent({
  userId: user.id,
  consentType: ConsentType.MARKETING,
  documentVersion: 'v1.0',
  metadata: {
    source: 'newsletter_subscription',
    campaign: 'summer_2025',
    referrer: 'homepage_banner'
  }
});
```

### 2. Manejar Actualizaciones de Versiones

Cuando actualices la versión de un documento:

```typescript
// 1. Actualizar versión en ConsentService
DOCUMENT_VERSIONS[ConsentType.TERMS_AND_CONDITIONS] = 'v3.0';

// 2. Verificar usuarios que necesitan actualizar
const users = await getAllActiveUsers();
for (const user of users) {
  const status = await consentService.getConsentStatus(
    undefined,
    user.id,
    ConsentType.TERMS_AND_CONDITIONS
  );

  if (status.needsUpdate) {
    // Enviar email notificando cambios
    await notifyTermsUpdate(user.email, status.currentVersion);
  }
}
```

### 3. Integrar con Eliminación de Cuenta

```typescript
// Cuando un usuario elimina su cuenta
const deleteUserAccount = async (userId) => {
  // 1. Revocar todos los consentimientos
  await consentService.revokeAllConsents(
    undefined,
    userId,
    'Account deletion request',
    userId
  );

  // 2. Continuar con eliminación
  await userService.delete(userId);
};
```

### 4. Validar Antes de Operaciones Sensibles

```typescript
const processPayment = async (userId, paymentData) => {
  // Verificar que el usuario tenga consentimientos actualizados
  const validation = await consentService.validateRequiredConsents(
    undefined,
    userId
  );

  if (!validation.valid) {
    throw new Error('User must accept updated terms before processing payment');
  }

  // Continuar con el pago
  await paymentService.process(paymentData);
};
```

## Cumplimiento Legal

Este sistema ayuda a cumplir con:

- **GDPR (Reglamento General de Protección de Datos)**
  - Registro de consentimientos explícitos
  - Derecho al olvido (revocación)
  - Auditoría completa

- **CCPA (California Consumer Privacy Act)**
  - Opt-out de marketing
  - Transparencia en procesamiento de datos

- **Ley de Protección de Datos Personales (Perú)**
  - Consentimiento informado
  - Registro de aceptaciones

## Troubleshooting

### Error: "Se requiere personId o userId"

Asegúrate de enviar al menos uno de los dos campos al registrar un consentimiento.

### Error: "Este consentimiento ya ha sido revocado"

No puedes revocar dos veces el mismo consentimiento. Verifica el estado antes.

### Consentimientos no se registran en el registro

Verifica que:
1. CommonModule esté importado en AuthModule
2. acceptTerms y acceptPrivacy sean `true` en el DTO
3. La migración de base de datos esté ejecutada

### Necesito cambiar la versión de un documento

Actualiza el objeto `DOCUMENT_VERSIONS` en `ConsentService` o configura variables de entorno.

## Mantenimiento

### Limpiar Consentimientos Antiguos (Opcional)

Si necesitas archivar consentimientos muy antiguos:

```sql
-- Mover a tabla de archivo (crear primero)
INSERT INTO consent_logs_archive
SELECT * FROM consent_logs
WHERE "createdAt" < NOW() - INTERVAL '5 years';

-- Eliminar de tabla principal
DELETE FROM consent_logs
WHERE "createdAt" < NOW() - INTERVAL '5 years';
```

### Monitoreo

Queries útiles para monitoreo:

```sql
-- Consentimientos registrados hoy
SELECT COUNT(*) FROM consent_logs
WHERE "acceptedAt"::date = CURRENT_DATE;

-- Consentimientos revocados en el último mes
SELECT COUNT(*) FROM consent_logs
WHERE "revokedAt" > NOW() - INTERVAL '30 days';

-- Usuarios sin consentimiento de términos actualizados
SELECT u.id, u.email
FROM users u
LEFT JOIN consent_logs cl ON cl."userId" = u.id
  AND cl."consentType" = 'TERMS_AND_CONDITIONS'
  AND cl."revokedAt" IS NULL
WHERE cl.id IS NULL OR cl."documentVersion" != 'v2.1';
```

## Soporte

Para problemas o preguntas sobre el sistema de consentimientos, contactar al equipo de desarrollo.
