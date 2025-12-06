# API de Certificados - Endpoints

## Endpoints Existentes

### GET /certificates
Lista todos los certificados
- **Auth**: Required (ADMIN, SUPER_ADMIN)
- **Returns**: Array de certificados

### POST /certificates
Crear nuevo certificado
- **Auth**: Required (ADMIN, SUPER_ADMIN)
- **Body**: `CreateCertificateDto`

### GET /certificates/:id
Obtener certificado por ID
- **Auth**: Public
- **Returns**: Certificado completo

### PATCH /certificates/:id
Actualizar certificado
- **Auth**: Required (ADMIN, SUPER_ADMIN)
- **Body**: `UpdateCertificateDto`

### DELETE /certificates/:id
Eliminar certificado
- **Auth**: Required (SUPER_ADMIN)

### POST /certificates/issue-batch/:eventId
Emitir certificados en lote para un evento
- **Auth**: Required (ADMIN, SUPER_ADMIN)
- **Returns**: Confirmación de proceso iniciado

### POST /certificates/approval/:enrollmentId
Emitir certificado de aprobación individual
- **Auth**: Required (ADMIN, SUPER_ADMIN)
- **Returns**: Certificado creado

### POST /certificates/approval-batch/:blockId
Emitir certificados de aprobación en lote
- **Auth**: Required (ADMIN, SUPER_ADMIN)
- **Returns**: Confirmación de proceso iniciado

### GET /certificates/verify/:code
Verificar certificado por código (legacy)
- **Auth**: Public
- **Throttling**: 10 req/min
- **Returns**: Certificado completo

---

## Nuevos Endpoints de Versionado

### POST /certificates/:id/reissue
Reemitir un certificado con datos actualizados

- **Auth**: Required (ADMIN, SUPER_ADMIN)
- **Method**: POST
- **URL**: `/certificates/:id/reissue`
- **Body**:
  ```json
  {
    "reason": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "validationCode": "string",
    "version": 2,
    "pdfUrl": "string",
    "lastReissuedAt": "ISO 8601",
    "lastReissuedBy": { "id": "uuid", "email": "string" },
    "versionHistory": [...]
  }
  ```
- **Errors**:
  - `404`: Certificate not found
  - `400`: Cannot reissue revoked certificate

---

### POST /certificates/:id/revoke
Revocar un certificado

- **Auth**: Required (ADMIN, SUPER_ADMIN)
- **Method**: POST
- **URL**: `/certificates/:id/revoke`
- **Body**:
  ```json
  {
    "reason": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "status": "REVOKED",
    "revokedAt": "ISO 8601",
    "revokedReason": "string",
    "revokedBy": { "id": "uuid", "email": "string" }
  }
  ```
- **Errors**:
  - `404`: Certificate not found
  - `400`: Certificate already revoked

---

### GET /certificates/validate/:code
Validar certificado por código (nuevo endpoint público mejorado)

- **Auth**: Public (no requiere autenticación)
- **Method**: GET
- **URL**: `/certificates/validate/:code`
- **Throttling**: 20 requests/min
- **Response - Válido**:
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
      "issuedAt": "2025-03-20T...",
      "version": 2
    }
  }
  ```
- **Response - Revocado**:
  ```json
  {
    "isValid": false,
    "status": "REVOKED",
    "message": "Certificado revocado. Motivo: Contracargo",
    "revocationInfo": {
      "revokedAt": "2025-12-05T...",
      "reason": "Contracargo - Pago revertido"
    }
  }
  ```
- **Response - No Encontrado**:
  ```json
  {
    "isValid": false,
    "status": "EXPIRED",
    "message": "Certificado no encontrado"
  }
  ```

---

### GET /certificates/:id/versions
Obtener historial de versiones de un certificado

- **Auth**: Required (ADMIN, SUPER_ADMIN)
- **Method**: GET
- **URL**: `/certificates/:id/versions`
- **Response**:
  ```json
  [
    {
      "version": 1,
      "issuedAt": "2025-03-20T...",
      "pdfUrl": "https://storage.../v1.pdf",
      "metadata": { ... },
      "reason": "Corrección de nombre"
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
- **Errors**:
  - `404`: Certificate not found

---

### POST /certificates/bulk-reissue
Reemitir múltiples certificados en lote

- **Auth**: Required (ADMIN, SUPER_ADMIN)
- **Method**: POST
- **URL**: `/certificates/bulk-reissue`
- **Body**:
  ```json
  {
    "certificateIds": [
      "uuid-1",
      "uuid-2",
      "uuid-3"
    ],
    "reason": "string"
  }
  ```
- **Response**:
  ```json
  {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "results": [
      {
        "certificateId": "uuid-1",
        "success": true,
        "newVersion": 2
      },
      {
        "certificateId": "uuid-2",
        "success": true,
        "newVersion": 3
      },
      {
        "certificateId": "uuid-3",
        "success": false,
        "error": "Cannot reissue a revoked certificate"
      }
    ]
  }
  ```
- **Errors**:
  - `400`: Invalid certificateIds array

---

## Resumen de Cambios

### Campos Nuevos en Certificate Entity

```typescript
version: number;                          // Default: 1
versionHistory: CertificateVersionHistory[];
revokedAt: Date | null;
revokedReason: string | null;
revokedBy: User | null;
lastReissuedAt: Date | null;
lastReissuedBy: User | null;
```

### DTOs Nuevos

1. `ReissueCertificateDto` - Para reemisión individual
2. `RevokeCertificateDto` - Para revocación
3. `BulkReissueCertificateDto` - Para reemisión masiva
4. `CertificateValidationDto` - Respuesta de validación
5. `BulkReissueResultDto` - Resultado de reemisión masiva

### Migraciones

- `1733430000000-AddCertificateVersioningFields.ts`

### Comportamiento Clave

1. **Código de Validación Inmutable**: El `validationCode` NUNCA cambia durante reemisiones
2. **Incremento Automático de Versión**: Cada reemisión incrementa `version` en 1
3. **Historial Completo**: Todas las versiones anteriores se guardan en `versionHistory` con sus PDFs
4. **Revocación Irreversible**: Un certificado revocado no puede ser reemitido
5. **Endpoint Público Sin Auth**: `/certificates/validate/:code` es accesible sin JWT
6. **Throttling**: Validación pública limitada a 20 req/min para prevenir abuso

### Flujo de Reemisión

```
1. Admin detecta error en datos → 2. Corrige en Person/Event
                                      ↓
3. Admin solicita reemisión ← 4. Sistema guarda versión actual en historial
                                      ↓
5. Sistema incrementa versión → 6. Obtiene datos frescos de entidades
                                      ↓
7. Regenera PDF con PdfService → 8. Sube a storage, obtiene URL
                                      ↓
9. Actualiza certificate.pdfUrl → 10. Mismo validationCode
```

### Seguridad

- **Roles**: Solo ADMIN y SUPER_ADMIN pueden reemitir/revocar
- **Auditoría**: Se registra quién realizó cada operación (`lastReissuedBy`, `revokedBy`)
- **Rate Limiting**: Endpoint de validación tiene throttling
- **Datos Públicos Mínimos**: Validación solo expone datos del certificado, no del usuario completo

### Performance

- Reemisión individual: ~100ms (depende de generación PDF)
- Reemisión masiva: ~100ms por certificado (throttled internamente)
- Validación: <10ms (query simple por índice único en validationCode)

### Compatibilidad

- **Backwards Compatible**: Certificados existentes tendrán `version = 1` automáticamente
- **Migración Automática**: No requiere data migration, solo schema migration
- **Endpoints Legacy**: `/certificates/verify/:code` sigue funcionando
