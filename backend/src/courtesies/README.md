# Módulo de Cortesías

## Descripción

El módulo de cortesías permite otorgar acceso gratuito a eventos a personas especiales como ponentes, VIPs, prensa, patrocinadores y staff.

## Características

### Tipos de Cortesía (`CourtesyType`)

- **SPEAKER**: Cortesía para ponentes
- **VIP**: Invitados especiales
- **PRESS**: Prensa/Medios
- **SPONSOR**: Patrocinadores
- **STAFF**: Personal del evento
- **OTHER**: Otros casos

### Alcance de Cortesía (`CourtesyScope`)

1. **FULL_EVENT**: Acceso completo al evento
   - Se crea automáticamente una `Registration` con precio 0
   - No se genera `Payment` ni `ComprobanteFiscal`
   - La persona puede asistir y recibir certificados

2. **ASSIGNED_SESSIONS_ONLY**: Solo sesiones donde es ponente
   - No se crea nada automáticamente
   - El acceso se determina por la relación Speaker-Session

3. **SPECIFIC_BLOCKS**: Solo bloques específicos (talleres/cursos)
   - Se crean `BlockEnrollments` gratuitos para cada bloque
   - No se genera `Payment` ni `ComprobanteFiscal`

### Estados (`CourtesyStatus`)

- **ACTIVE**: Cortesía activa
- **USED**: Ya se usó (tiene registration/enrollments)
- **CANCELLED**: Cancelada por el organizador
- **EXPIRED**: Expiró sin ser usada

## Endpoints

### POST /courtesies
Otorga una cortesía a una persona.

**Roles permitidos**: `ORG_ADMIN`, `SUPER_ADMIN`

**Body**:
```json
{
  "eventId": "uuid",
  "personId": "uuid",
  // O alternativamente:
  "personData": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "documentType": "DNI",
    "documentNumber": "string"
  },
  "type": "SPEAKER",
  "scope": "FULL_EVENT",
  "specificBlockIds": ["uuid"], // Solo si scope es SPECIFIC_BLOCKS
  "speakerId": "uuid", // Solo si type es SPEAKER
  "reason": "string",
  "notes": "string",
  "validUntil": "2024-12-31T23:59:59Z"
}
```

### DELETE /courtesies/:id
Cancela una cortesía.

**Roles permitidos**: `ORG_ADMIN`, `SUPER_ADMIN`

**Body**:
```json
{
  "reason": "string"
}
```

### GET /courtesies/event/:eventId
Obtiene todas las cortesías de un evento.

**Roles permitidos**: `ORG_ADMIN`, `SUPER_ADMIN`

### GET /courtesies/person/:personId
Obtiene todas las cortesías de una persona.

**Roles permitidos**: Usuario autenticado

### GET /courtesies/:id
Obtiene una cortesía por ID.

**Roles permitidos**: Usuario autenticado

### POST /courtesies/event/:eventId/grant-speakers
Otorga cortesías automáticas a todos los ponentes del evento.

**Roles permitidos**: `ORG_ADMIN`, `SUPER_ADMIN`

**Body**:
```json
{
  "scope": "FULL_EVENT"
}
```

### GET /courtesies/event/:eventId/stats
Obtiene estadísticas de cortesías de un evento.

**Roles permitidos**: `ORG_ADMIN`, `SUPER_ADMIN`

## Flujo de Uso

### Caso 1: Cortesía para Ponente

```typescript
// 1. Ana (ORG_ADMIN) agrega a Carlos como ponente del evento
// 2. Ana otorga cortesía tipo SPEAKER con scope FULL_EVENT

POST /courtesies
{
  "eventId": "event-123",
  "personData": {
    "firstName": "Carlos",
    "lastName": "García",
    "email": "carlos@example.com",
    "documentType": "DNI",
    "documentNumber": "12345678"
  },
  "type": "SPEAKER",
  "scope": "FULL_EVENT",
  "reason": "Ponente de la conferencia magistral"
}

// 3. Sistema automáticamente:
//    - Crea registro de Courtesy
//    - Busca o crea Person
//    - Busca o crea Attendee
//    - Crea Registration con precio=0, origin=COURTESY
//    - No genera Payment ni ComprobanteFiscal
//    - Envía email de notificación

// 4. Carlos puede:
//    - Asistir a todas las sesiones
//    - Recibir certificado de ponente
//    - Recibir certificado de participación (si asiste)
```

### Caso 2: Cortesía para VIP con Acceso a Bloques Específicos

```typescript
POST /courtesies
{
  "eventId": "event-123",
  "personId": "person-456",
  "type": "VIP",
  "scope": "SPECIFIC_BLOCKS",
  "specificBlockIds": ["block-1", "block-2"],
  "reason": "Invitado especial del organizador"
}

// Sistema crea BlockEnrollments gratuitos para block-1 y block-2
```

### Caso 3: Otorgar Cortesías Masivas a Ponentes

```typescript
POST /courtesies/event/event-123/grant-speakers
{
  "scope": "FULL_EVENT"
}

// Sistema:
// - Obtiene todos los speakers del evento
// - Para cada speaker:
//   - Busca o crea Person
//   - Verifica que no tenga cortesía activa
//   - Crea cortesía tipo SPEAKER
//   - Crea Registration gratuita
```

## Reglas de Negocio

1. **Una persona solo puede tener UNA cortesía activa por evento**
   - Se valida con índice único en `(eventId, personId)`

2. **Las cortesías no generan documentos fiscales**
   - No se crea `Payment`
   - No se crea `ComprobanteFiscal`
   - Se registra como `origin: COURTESY` en `Registration`

3. **Todo se registra en auditoría**
   - Usuario que otorgó la cortesía
   - Fecha de otorgamiento
   - Usuario que canceló (si aplica)
   - Razón de cancelación

4. **Las cortesías canceladas no eliminan la asistencia registrada**
   - Si la persona ya asistió, su asistencia queda registrada
   - Se cancela el acceso futuro

## Estructura de Base de Datos

### Tabla: courtesies

```sql
CREATE TABLE courtesies (
  id UUID PRIMARY KEY,
  eventId UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  personId UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  attendeeId UUID REFERENCES attendees(id),
  type courtesy_type_enum NOT NULL DEFAULT 'OTHER',
  scope courtesy_scope_enum NOT NULL DEFAULT 'FULL_EVENT',
  status courtesy_status_enum NOT NULL DEFAULT 'ACTIVE',
  reason TEXT,
  notes TEXT,
  speakerId UUID REFERENCES speakers(id),
  validUntil TIMESTAMPTZ,
  grantedById UUID NOT NULL REFERENCES users(id),
  grantedAt TIMESTAMPTZ NOT NULL,
  cancelledById UUID REFERENCES users(id),
  cancelledAt TIMESTAMPTZ,
  cancellationReason TEXT,
  createdAt TIMESTAMPTZ NOT NULL,
  updatedAt TIMESTAMPTZ NOT NULL,
  UNIQUE(eventId, personId)
);
```

### Tabla: courtesy_blocks (Many-to-Many)

```sql
CREATE TABLE courtesy_blocks (
  courtesyId UUID NOT NULL REFERENCES courtesies(id) ON DELETE CASCADE,
  blockId UUID NOT NULL REFERENCES evaluable_blocks(id) ON DELETE CASCADE,
  PRIMARY KEY (courtesyId, blockId)
);
```

### Cambios en Registrations

```sql
ALTER TABLE registrations
  ADD COLUMN origin registration_origin_enum NOT NULL DEFAULT 'PURCHASE',
  ADD COLUMN courtesyId UUID REFERENCES courtesies(id);
```

### Cambios en Block Enrollments

```sql
ALTER TABLE block_enrollments
  ADD COLUMN courtesyId UUID REFERENCES courtesies(id);
```

## Traducciones (i18n)

Las traducciones se encuentran en:
- `/backend/src/i18n/es/courtesies.json`
- `/backend/src/i18n/en/courtesies.json`

## Migración

La migración se encuentra en:
- `/backend/src/database/migrations/1733470000000-AddCourtesiesSystem.ts`

Para ejecutar la migración:

```bash
npm run migration:run
```

Para revertir la migración:

```bash
npm run migration:revert
```

## Servicios Relacionados

- **PersonsService**: Para buscar/crear personas
- **EmailQueueService**: Para enviar notificaciones
- **RegistrationsService**: Para crear registrations gratuitas
- **EnrollmentsService**: Para crear enrollments gratuitos

## Notas Importantes

1. **Relaciones circulares**: Se usan referencias de string ('Courtesy') en `Registration` y `BlockEnrollment` para evitar dependencias circulares.

2. **Transacciones**: Todas las operaciones de creación/cancelación usan transacciones SERIALIZABLE para garantizar consistencia.

3. **Validaciones**: Se validan todos los casos edge:
   - Evento cancelado
   - Persona duplicada
   - Bloques inválidos
   - Speaker no existente

4. **Notificaciones**: Se envían emails asíncronos a través de la cola de emails.

## Ejemplos de Uso en el Código

```typescript
// Inyectar el servicio
constructor(
  private readonly courtesiesService: CourtesiesService,
) {}

// Otorgar cortesía
const courtesy = await this.courtesiesService.grant(
  {
    eventId: 'event-123',
    personData: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      documentType: 'DNI',
      documentNumber: '12345678',
    },
    type: CourtesyType.SPEAKER,
    scope: CourtesyScope.FULL_EVENT,
    reason: 'Ponente principal',
  },
  currentUser,
);

// Cancelar cortesía
await this.courtesiesService.cancel(
  'courtesy-123',
  { reason: 'El ponente declinó la invitación' },
  currentUser,
);

// Obtener cortesías de un evento
const courtesies = await this.courtesiesService.findByEvent('event-123');

// Estadísticas
const stats = await this.courtesiesService.getEventStats('event-123');
```
