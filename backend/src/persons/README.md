# Módulo de Personas (Persons)

## Descripción
El módulo de Personas es el modelo unificado de identidad en el sistema. Centraliza la información de todos los participantes (asistentes, ponentes, etc.) y permite gestionar sus datos de forma consistente.

## Características Principales

### 1. Entidad Central de Identidad
- **Person** es el individuo real que aparece en certificados, listas de asistencia y comprobantes
- Cada persona tiene un identificador único basado en tipo y número de documento
- Una persona puede o no tener una cuenta de usuario asociada

### 2. Campos de la Entidad Person

#### Información Personal
- `firstName`: Nombres
- `lastName`: Apellidos
- `email`: Correo electrónico principal
- `phone`: Teléfono/celular
- `country`: País
- `birthDate`: Fecha de nacimiento

#### Identificación
- `documentType`: Tipo de documento (DNI, CE, PASAPORTE, OTRO)
- `documentNumber`: Número de documento
- **Índice único**: La combinación de `documentType` + `documentNumber` es única en el sistema

#### Datos del Tutor (para menores)
- `guardianName`: Nombre del tutor
- `guardianDocument`: Documento del tutor
- `guardianPhone`: Teléfono del tutor
- `guardianAuthorizationUrl`: URL del archivo de autorización

#### Flags de Control
- `flagRisk`: Marca de riesgo (para casos especiales)
- `flagDataObserved`: Marca de datos observados/inconsistentes

#### Estado y Fusión
- `status`: ACTIVE o MERGED
- `mergedToPerson`: Referencia a la persona principal (si fue fusionada)
- `mergedAt`: Fecha de fusión
- `mergedBy`: Usuario que realizó la fusión

#### Vinculación
- `user`: Cuenta de usuario asociada (opcional)

## API Endpoints

### Personas

#### `POST /persons`
Crea una nueva persona
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "documentType": "DNI",
  "documentNumber": "12345678",
  "phone": "+51999999999",
  "country": "PE",
  "birthDate": "1990-01-01"
}
```

#### `GET /persons`
Lista todas las personas activas

#### `GET /persons/:id`
Obtiene una persona por ID

#### `GET /persons/by-email/:email`
Busca una persona por email

#### `GET /persons/by-document?type=DNI&number=12345678`
Busca una persona por tipo y número de documento

#### `PATCH /persons/:id`
Actualiza los datos de una persona

#### `PATCH /persons/:id/link-user`
Vincula una persona con una cuenta de usuario
```json
{
  "userId": "uuid-del-usuario"
}
```

#### `PATCH /persons/:id/unlink-user`
Desvincula una persona de su cuenta de usuario

#### `POST /persons/:primaryId/merge/:secondaryId`
Fusiona dos personas (requiere rol ADMIN)
```json
{
  "preferredEmail": "email@example.com",
  "preferredPhone": "+51999999999"
}
```

#### `GET /persons/:id/duplicates`
Encuentra posibles duplicados de una persona

#### `GET /persons/:id/merge-history`
Obtiene el historial de fusiones de una persona

#### `DELETE /persons/:id`
Marca una persona como inactiva (soft delete)

## Servicios

### PersonsService

#### `findByEmail(email: string): Promise<Person | null>`
Busca una persona por email

#### `findByDocument(documentType: DocumentType, documentNumber: string): Promise<Person | null>`
Busca una persona por tipo y número de documento

#### `findOrCreate(data: CreatePersonDto): Promise<Person>`
Busca una persona existente o crea una nueva. Primero busca por documento, luego por email.

#### `create(createPersonDto: CreatePersonDto): Promise<Person>`
Crea una nueva persona (lanza error si ya existe)

#### `update(id: string, updatePersonDto: UpdatePersonDto): Promise<Person>`
Actualiza los datos de una persona

#### `linkToUser(personId: string, userId: string): Promise<Person>`
Vincula una persona con una cuenta de usuario

#### `unlinkFromUser(personId: string): Promise<Person>`
Desvincula una persona de su cuenta de usuario

#### `merge(sourcePersonId: string, targetPersonId: string, mergedByUserId: string): Promise<Person>`
Fusiona dos personas (marca la origen como MERGED)

### PersonMergeService

Servicio especializado para la gestión de fusión de personas duplicadas.

#### `findPotentialDuplicates(personId: string): Promise<Person[]>`
Encuentra posibles duplicados basándose en email o documento

#### `merge(primaryId: string, secondaryId: string, performedBy: User, mergeDto: MergePersonsDto): Promise<MergeResultDto>`
Fusiona dos personas y reasigna todas las referencias (attendees, registrations, etc.)

#### `getMergeHistory(personId: string): Promise<Person[]>`
Obtiene todas las personas que fueron fusionadas en esta persona

## Integración con Attendees

Cuando se crea un `Attendee`, el sistema automáticamente:
1. Busca una `Person` existente por documento
2. Si no existe, busca por email
3. Si tampoco existe, crea una nueva `Person`
4. Vincula el `Attendee` con la `Person` encontrada/creada

Esto garantiza que:
- Cada `Attendee` siempre tiene una `Person` asociada (relación NOT NULL)
- No se duplican personas en el sistema
- Los datos están unificados

## Migraciones

### 1733420000000-AddPersonaOrganizerAndTicketScope.ts
- Crea la tabla `persons` con todos los campos base
- Crea índices únicos en documento y email
- Agrega el campo `personId` a `attendees` (nullable)

### 1733440000000-AddPersonMergeFields.ts
- Agrega campos `mergedAt` y `mergedById` para seguimiento de fusiones

### 1733443200000-UpdatePersonAndAttendeeRelations.ts
- Migra todos los attendees existentes creando sus personas correspondientes
- Hace la relación `personId` en `attendees` NOT NULL
- Actualiza las constraints de FK

## Validaciones

### CreatePersonDto
- `firstName`: requerido, string
- `lastName`: requerido, string
- `email`: requerido, email válido
- `documentType`: requerido, enum (DNI, CE, PASSPORT, OTHER)
- `documentNumber`: requerido, string
- `phone`: opcional, string
- `country`: opcional, string
- `birthDate`: opcional, fecha en formato ISO
- Datos del tutor: opcionales
- Flags: opcionales, boolean

### UpdatePersonDto
Todos los campos son opcionales (PartialType de CreatePersonDto)

## Casos de Uso

### Registro de Asistente
1. Usuario completa formulario de registro
2. Sistema busca Person por documento
3. Si existe, usa esa Person
4. Si no existe, crea nueva Person
5. Crea Attendee vinculado a Person

### Creación de Cuenta
1. Usuario se registra con email
2. Sistema busca Person con ese email
3. Si existe, vincula Person con nueva cuenta User
4. Si no existe, crea Person y luego User

### Fusión de Duplicados
1. Admin detecta dos Person duplicadas
2. Llama a `POST /persons/:primaryId/merge/:secondaryId`
3. Sistema reasigna todas las referencias (attendees, registrations, etc.) a la persona primaria
4. Marca la persona secundaria como MERGED
5. Guarda referencia y metadata de la fusión

## Mejores Prácticas

1. **Siempre usar `findOrCreate`** cuando se registre un nuevo participante
2. **No crear Person directamente** en otros servicios, usar PersonsService
3. **Verificar duplicados** antes de crear eventos masivos
4. **Respetar el estado MERGED** - nunca reactivar personas fusionadas
5. **Validar datos del tutor** si la persona es menor de edad
6. **Usar los flags** para marcar casos especiales que requieran revisión

## Seguridad

- Todos los endpoints requieren autenticación (JwtAuthGuard)
- La fusión de personas requiere rol de ADMIN
- Los datos sensibles (como documento) solo se exponen a usuarios autorizados
- Las eliminaciones son soft-delete (cambian estado a MERGED)

## Testing

Para probar el módulo:

```bash
# Crear persona
curl -X POST http://localhost:3000/persons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "documentType": "DNI",
    "documentNumber": "12345678"
  }'

# Buscar por email
curl http://localhost:3000/persons/by-email/test@example.com \
  -H "Authorization: Bearer YOUR_TOKEN"

# Buscar por documento
curl "http://localhost:3000/persons/by-document?type=DNI&number=12345678" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
