# Guía de Pruebas - Sistema de Versionado de Certificados

## Preparación

### 1. Ejecutar Migración

```bash
cd /Users/carevalojesus/Dev/cip-eventos/backend
npm run migration:run
```

**Salida esperada**:
```
Migration AddCertificateVersioningFields1733430000000 has been executed successfully
```

### 2. Verificar Base de Datos

```sql
-- Conectarse a PostgreSQL
psql -d cip_eventos

-- Verificar nuevos campos
\d certificates

-- Deberías ver:
-- version | integer | default 1
-- versionHistory | jsonb
-- revokedAt | timestamp
-- revokedReason | text
-- revokedById | uuid
-- lastReissuedAt | timestamp
-- lastReissuedById | uuid
```

### 3. Iniciar Servidor

```bash
npm run start:dev
```

---

## Tests Manuales con cURL

### Test 1: Obtener Token de Admin

```bash
# Login como admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "tu-password"
  }'

# Guardar el token
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Test 2: Listar Certificados Existentes

```bash
curl http://localhost:3000/api/certificates \
  -H "Authorization: Bearer $TOKEN"
```

**Guardar un ID de certificado para las siguientes pruebas**:
```bash
export CERT_ID="550e8400-e29b-41d4-a716-446655440000"
```

### Test 3: Validar un Certificado (Público)

```bash
# Obtener código de validación de un certificado
curl http://localhost:3000/api/certificates/$CERT_ID \
  -H "Authorization: Bearer $TOKEN" | jq -r '.validationCode'

export VALIDATION_CODE="CIP-2025-ABC123"

# Validar (sin token - público)
curl http://localhost:3000/api/certificates/validate/$VALIDATION_CODE
```

**Salida esperada**:
```json
{
  "isValid": true,
  "status": "ACTIVE",
  "message": "Certificado válido",
  "certificate": {
    "type": "ATTENDANCE",
    "recipientName": "Juan Pérez",
    "eventName": "Congreso 2025",
    "eventDate": "15/03/2025",
    "hours": 8,
    "issuedAt": "2025-03-20T10:00:00.000Z",
    "version": 1
  }
}
```

### Test 4: Reemitir un Certificado

**IMPORTANTE**: Antes de reemitir, modifica algún dato en la BD:

```sql
-- Ejemplo: Corregir nombre de un attendee
UPDATE attendees
SET "firstName" = 'Luis'
WHERE id = (
  SELECT r."attendeeId"
  FROM certificates c
  JOIN registrations r ON c."registrationId" = r.id
  WHERE c.id = 'TU-CERT-ID'
);
```

Ahora reemitir:

```bash
curl -X POST http://localhost:3000/api/certificates/$CERT_ID/reissue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Corrección de nombre: Luiis → Luis"
  }'
```

**Salida esperada**:
```json
{
  "id": "550e8400-...",
  "version": 2,  // 👈 Incrementado
  "validationCode": "CIP-2025-ABC123",  // 👈 Mismo código
  "pdfUrl": "https://storage.../CERT-CIP-2025-ABC123.pdf",  // 👈 Nuevo PDF
  "lastReissuedAt": "2025-12-05T...",
  "lastReissuedBy": {
    "id": "user-uuid",
    "email": "admin@example.com"
  },
  "versionHistory": [
    {
      "version": 1,
      "issuedAt": "2025-03-20T...",
      "pdfUrl": "https://storage.../old.pdf",
      "reason": "Corrección de nombre: Luiis → Luis"
    }
  ]
}
```

### Test 5: Validar Después de Reemisión

```bash
curl http://localhost:3000/api/certificates/validate/$VALIDATION_CODE
```

**Verificar**:
- ✅ `version` debe ser 2
- ✅ `recipientName` debe estar corregido
- ✅ `validationCode` debe ser el mismo

### Test 6: Ver Historial de Versiones

```bash
curl http://localhost:3000/api/certificates/$CERT_ID/versions \
  -H "Authorization: Bearer $TOKEN"
```

**Salida esperada**:
```json
[
  {
    "version": 1,
    "issuedAt": "2025-03-20T...",
    "pdfUrl": "https://storage.../v1.pdf",
    "metadata": { ... },
    "reason": "Corrección de nombre: Luiis → Luis"
  },
  {
    "version": 2,
    "issuedAt": "2025-12-05T...",
    "pdfUrl": "https://storage.../v2.pdf",
    "metadata": { ... },
    "reason": "Versión actual"
  }
]
```

### Test 7: Revocar un Certificado

```bash
curl -X POST http://localhost:3000/api/certificates/$CERT_ID/revoke \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Contracargo - Pago revertido por el banco"
  }'
```

**Salida esperada**:
```json
{
  "id": "550e8400-...",
  "status": "REVOKED",
  "revokedAt": "2025-12-05T...",
  "revokedReason": "Contracargo - Pago revertido por el banco",
  "revokedBy": {
    "id": "user-uuid",
    "email": "admin@example.com"
  }
}
```

### Test 8: Validar Certificado Revocado

```bash
curl http://localhost:3000/api/certificates/validate/$VALIDATION_CODE
```

**Salida esperada**:
```json
{
  "isValid": false,
  "status": "REVOKED",
  "message": "Certificado revocado. Motivo: Contracargo - Pago revertido por el banco",
  "revocationInfo": {
    "revokedAt": "2025-12-05T...",
    "reason": "Contracargo - Pago revertido por el banco"
  }
}
```

### Test 9: Intentar Reemitir Certificado Revocado (Debe Fallar)

```bash
curl -X POST http://localhost:3000/api/certificates/$CERT_ID/reissue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Intento de reemisión"
  }'
```

**Salida esperada**:
```json
{
  "statusCode": 400,
  "message": "Cannot reissue a revoked certificate. Please create a new one instead.",
  "error": "Bad Request"
}
```

### Test 10: Reemisión Masiva

```bash
# Obtener varios IDs de certificados
curl http://localhost:3000/api/certificates \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.[0:3] | .[].id'

# Reemitir en lote
curl -X POST http://localhost:3000/api/certificates/bulk-reissue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "certificateIds": [
      "id-1",
      "id-2",
      "id-3"
    ],
    "reason": "Actualización masiva de datos"
  }'
```

**Salida esperada**:
```json
{
  "total": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "certificateId": "id-1",
      "success": true,
      "newVersion": 2
    },
    {
      "certificateId": "id-2",
      "success": true,
      "newVersion": 3
    },
    {
      "certificateId": "id-3",
      "success": false,
      "error": "Certificate is already revoked"
    }
  ]
}
```

---

## Tests Unitarios (Opcional)

### Crear Archivo de Test

```bash
cd /Users/carevalojesus/Dev/cip-eventos/backend
touch src/certificates/certificates.service.spec.ts
```

### Contenido de `certificates.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CertificatesService } from './certificates.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Certificate } from './entities/certificate.entity';

describe('CertificatesService - Versioning', () => {
  let service: CertificatesService;
  let repository: any;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      // ... otros métodos
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        {
          provide: getRepositoryToken(Certificate),
          useValue: mockRepository,
        },
        // ... otros providers
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    repository = module.get(getRepositoryToken(Certificate));
  });

  describe('reissue', () => {
    it('should increment version when reissuing', async () => {
      const mockCert = {
        id: '1',
        version: 1,
        status: 'ACTIVE',
        versionHistory: [],
      };

      repository.findOne.mockResolvedValue(mockCert);
      repository.save.mockImplementation((cert) => Promise.resolve(cert));

      const result = await service.reissue('1', 'Test', {} as any);

      expect(result.version).toBe(2);
    });

    it('should throw error when reissuing revoked certificate', async () => {
      const mockCert = { status: 'REVOKED' };
      repository.findOne.mockResolvedValue(mockCert);

      await expect(
        service.reissue('1', 'Test', {} as any)
      ).rejects.toThrow('Cannot reissue a revoked certificate');
    });

    it('should save previous version in history', async () => {
      const mockCert = {
        version: 1,
        pdfUrl: 'old.pdf',
        versionHistory: [],
      };

      repository.findOne.mockResolvedValue(mockCert);

      await service.reissue('1', 'Correction', {} as any);

      expect(mockCert.versionHistory).toHaveLength(1);
      expect(mockCert.versionHistory[0].reason).toBe('Correction');
    });
  });
});
```

### Ejecutar Tests

```bash
npm test -- certificates.service.spec.ts
```

---

## Verificación de Base de Datos

### 1. Verificar Certificados Reemitidos

```sql
SELECT
  id,
  "validationCode",
  version,
  "lastReissuedAt",
  "versionHistory"
FROM certificates
WHERE version > 1;
```

### 2. Verificar Certificados Revocados

```sql
SELECT
  id,
  "validationCode",
  status,
  "revokedAt",
  "revokedReason",
  "revokedById"
FROM certificates
WHERE status = 'REVOKED';
```

### 3. Verificar Historial

```sql
SELECT
  id,
  "validationCode",
  version,
  "versionHistory"::text
FROM certificates
WHERE "versionHistory" IS NOT NULL;
```

---

## Checklist Final

### Funcionalidad
- [ ] Migración ejecutada correctamente
- [ ] Certificados se pueden reemitir
- [ ] Versión incrementa correctamente
- [ ] Código de validación no cambia
- [ ] Historial se guarda
- [ ] Certificados se pueden revocar
- [ ] Validación pública funciona
- [ ] Certificados revocados se detectan en validación
- [ ] No se pueden reemitir certificados revocados
- [ ] Reemisión masiva funciona

### Base de Datos
- [ ] Campos nuevos están presentes
- [ ] Foreign keys creadas correctamente
- [ ] Certificados existentes tienen version = 1
- [ ] versionHistory es jsonb válido

### Seguridad
- [ ] Endpoint de validación es público
- [ ] Reemisión requiere autenticación
- [ ] Solo ADMIN/SUPER_ADMIN pueden reemitir/revocar
- [ ] Throttling funciona en validación

### Auditoría
- [ ] lastReissuedBy se registra
- [ ] revokedBy se registra
- [ ] Fechas se registran correctamente
- [ ] Motivos se guardan en historial

---

## Troubleshooting

### Error: "Column version already exists"
**Solución**: Revertir y volver a ejecutar
```bash
npm run migration:revert
npm run migration:run
```

### Error: "Cannot find module ..."
**Solución**: Reinstalar dependencias
```bash
rm -rf node_modules
npm install
```

### Error: "Certificate not found"
**Solución**: Verificar que el ID existe
```sql
SELECT id, "validationCode" FROM certificates LIMIT 5;
```

### Error: "JWT token invalid"
**Solución**: Obtener nuevo token
```bash
# Re-login y obtener token fresco
curl -X POST http://localhost:3000/api/auth/login ...
```

---

## Próximos Pasos Recomendados

1. **Integración Frontend**
   - Crear componente de validación pública
   - Agregar botones de reemisión en panel admin
   - Mostrar historial de versiones

2. **Notificaciones**
   - Email cuando se reemite certificado
   - Email cuando se revoca certificado

3. **Analytics**
   - Dashboard de reemisiones
   - Gráficos de revocaciones
   - Estadísticas de validaciones públicas

4. **Mejoras**
   - Descarga de versiones antiguas desde admin
   - Export de historial a Excel
   - Logs de auditoría en tabla separada

---

**Guía actualizada**: 2025-12-05
**Versión del sistema**: 2.0.0
