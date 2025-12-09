# Ejemplo de Integración RENIEC

Este documento muestra cómo integrar la validación RENIEC en el flujo de registro de personas.

## Caso de Uso: Registro de Invitado al Evento

Cuando un invitado se registra a un evento, queremos validar automáticamente su DNI con RENIEC.

### 1. En RegistrationsService

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PersonsService } from '../persons/persons.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private readonly personsService: PersonsService,
  ) {}

  async registerGuest(dto: CreateRegistrationDto) {
    // 1. Buscar o crear persona con validación RENIEC
    const person = await this.personsService.createWithReniecValidation({
      firstName: dto.firstName,
      lastName: dto.lastName,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      email: dto.email,
      phone: dto.phone,
    });

    // 2. Verificar si los datos requieren revisión
    if (person.flagDataObserved) {
      this.logger.warn(
        `Registro creado pero requiere revisión. ` +
        `Persona ID: ${person.id}, ` +
        `Score RENIEC: ${person.reniecValidationScore}%`
      );

      // Opcional: Notificar al organizador
      // await this.notifyOrganizerAboutObservedData(person);
    }

    // 3. Crear el registro normalmente
    const registration = await this.createRegistration(person, dto);

    return {
      registration,
      requiresReview: person.flagDataObserved,
      validationScore: person.reniecValidationScore,
    };
  }
}
```

### 2. Respuesta al frontend

```typescript
// registration.controller.ts
@Post('guest')
@Public()
@Throttle({ default: { limit: 5, ttl: 60000 } })
async registerGuest(@Body() dto: CreateRegistrationDto) {
  const result = await this.registrationsService.registerGuest(dto);

  return {
    success: true,
    registrationId: result.registration.id,
    requiresReview: result.requiresReview,
    message: result.requiresReview
      ? 'Registro creado exitosamente. Los datos están en revisión.'
      : 'Registro creado exitosamente.',
  };
}
```

### 3. Frontend - Mostrar mensaje al usuario

```typescript
// En el frontend
const response = await registerGuest({
  firstName: 'Juan',
  lastName: 'Pérez García',
  documentType: 'DNI',
  documentNumber: '12345678',
  email: 'juan@example.com',
  ticketId: 'ticket-uuid',
});

if (response.requiresReview) {
  showWarning(
    'Tu registro fue creado pero los datos están en revisión. ' +
    'El organizador verificará la información antes de aprobar tu inscripción.'
  );
} else {
  showSuccess('¡Registro exitoso!');
}
```

## Caso de Uso: Dashboard del Organizador

El organizador puede ver personas con datos observados y decidir si aprobar o no.

### 1. Endpoint para listar personas con datos observados

```typescript
// persons.controller.ts
@Get('with-observed-data')
@Roles('ORG_ADMIN', 'SUPER_ADMIN')
async getPersonsWithObservedData(
  @Query('eventId') eventId?: string,
) {
  const persons = await this.personsService.findWithObservedData(eventId);

  return persons.map(person => ({
    id: person.id,
    fullName: `${person.firstName} ${person.lastName}`,
    documentNumber: person.documentNumber,
    email: person.email,
    reniecValidationScore: person.reniecValidationScore,
    reniecValidatedAt: person.reniecValidatedAt,
    flagDataObserved: person.flagDataObserved,
    registrations: person.registrations?.length || 0,
  }));
}
```

### 2. Servicio para encontrar personas con datos observados

```typescript
// persons.service.ts
async findWithObservedData(eventId?: string): Promise<Person[]> {
  const query = this.personRepository
    .createQueryBuilder('person')
    .where('person.flagDataObserved = :flag', { flag: true })
    .leftJoinAndSelect('person.registrations', 'registrations')
    .orderBy('person.reniecValidationScore', 'ASC'); // Los peores primero

  if (eventId) {
    query.andWhere('registrations.eventId = :eventId', { eventId });
  }

  return query.getMany();
}
```

### 3. Frontend - Dashboard de revisión

```typescript
// Dashboard del organizador
const personsToReview = await getPersonsWithObservedData(eventId);

personsToReview.forEach(person => {
  console.log(`
    Nombre: ${person.fullName}
    DNI: ${person.documentNumber}
    Score RENIEC: ${person.reniecValidationScore}%
    Estado: ${person.reniecValidationScore < 50 ? '🔴 Requiere atención' : '🟡 Revisar'}
  `);
});
```

## Caso de Uso: Validación Manual

Un administrador puede re-validar o consultar RENIEC manualmente.

### 1. Validar persona existente

```typescript
// En un controlador admin
@Post('persons/:id/revalidate')
@Roles('ORG_ADMIN', 'SUPER_ADMIN')
async revalidatePerson(@Param('id') id: string) {
  const person = await this.personsService.findOne(id);

  await this.personsService.validateWithReniec(person);

  return {
    success: true,
    score: person.reniecValidationScore,
    requiresReview: person.flagDataObserved,
    validatedAt: person.reniecValidatedAt,
  };
}
```

### 2. Consultar RENIEC directamente

```typescript
// Consultar datos oficiales de RENIEC
@Get('admin/reniec/:dni')
@Roles('ORG_ADMIN', 'SUPER_ADMIN')
async consultReniec(@Param('dni') dni: string) {
  const data = await this.reniecService.queryByDni(dni);

  if (!data) {
    throw new NotFoundException('DNI no encontrado en RENIEC');
  }

  return {
    dni: data.dni,
    nombreCompleto: data.nombreCompleto,
    nombres: data.nombres,
    apellidoPaterno: data.apellidoPaterno,
    apellidoMaterno: data.apellidoMaterno,
  };
}
```

## Caso de Uso: Aprobación Manual

El organizador puede aprobar manualmente una persona con datos observados.

### 1. Aprobar persona

```typescript
// persons.service.ts
async approveObservedData(personId: string, adminUserId: string): Promise<Person> {
  const person = await this.findOne(personId);

  if (!person.flagDataObserved) {
    throw new BadRequestException('Esta persona no tiene datos observados');
  }

  // Remover el flag de datos observados
  person.flagDataObserved = false;

  // Opcional: Agregar nota de aprobación
  // person.approvedBy = { id: adminUserId } as any;
  // person.approvedAt = new Date();

  return this.personRepository.save(person);
}
```

### 2. Endpoint de aprobación

```typescript
@Post('persons/:id/approve')
@Roles('ORG_ADMIN', 'SUPER_ADMIN')
async approvePerson(
  @Param('id') id: string,
  @CurrentUser() user: User,
) {
  const person = await this.personsService.approveObservedData(id, user.id);

  return {
    success: true,
    message: 'Persona aprobada exitosamente',
    person: {
      id: person.id,
      fullName: `${person.firstName} ${person.lastName}`,
      flagDataObserved: person.flagDataObserved,
    },
  };
}
```

## Caso de Uso: Notificaciones

Notificar al organizador cuando hay datos observados.

### 1. Servicio de notificaciones

```typescript
// notifications.service.ts
async notifyObservedData(person: Person, eventId: string) {
  const event = await this.eventsService.findOne(eventId);
  const organizer = event.organizer;

  await this.sendEmail({
    to: organizer.contactEmail,
    subject: 'Datos de inscripción requieren revisión',
    template: 'observed-data',
    context: {
      personName: `${person.firstName} ${person.lastName}`,
      dni: person.documentNumber,
      score: person.reniecValidationScore,
      eventName: event.title,
      reviewUrl: `${FRONTEND_URL}/admin/persons/${person.id}`,
    },
  });
}
```

### 2. Integrar en el flujo de registro

```typescript
// registrations.service.ts
async registerGuest(dto: CreateRegistrationDto) {
  const person = await this.personsService.createWithReniecValidation({...});

  if (person.flagDataObserved) {
    // Notificar al organizador
    await this.notificationsService.notifyObservedData(
      person,
      dto.eventId
    );
  }

  // Continuar con el registro...
}
```

## Caso de Uso: Reportes

Generar reportes de validaciones RENIEC.

### 1. Estadísticas de validación

```typescript
// reports.service.ts
async getReniecValidationStats(eventId: string) {
  const stats = await this.personRepository
    .createQueryBuilder('person')
    .select('COUNT(*)', 'total')
    .addSelect('COUNT(*) FILTER (WHERE person.flagDataObserved = true)', 'observed')
    .addSelect('COUNT(*) FILTER (WHERE person.reniecValidatedAt IS NOT NULL)', 'validated')
    .addSelect('AVG(person.reniecValidationScore)', 'averageScore')
    .leftJoin('person.registrations', 'registration')
    .where('registration.eventId = :eventId', { eventId })
    .getRawOne();

  return {
    total: parseInt(stats.total),
    validated: parseInt(stats.validated),
    observed: parseInt(stats.observed),
    averageScore: parseFloat(stats.averageScore || 0).toFixed(2),
    validationRate: ((stats.validated / stats.total) * 100).toFixed(2) + '%',
  };
}
```

## Configuración Recomendada

### Desarrollo
```env
RENIEC_VALIDATION_ENABLED=false
```

### Staging
```env
RENIEC_VALIDATION_ENABLED=true
RENIEC_MIN_MATCH_SCORE=70  # Más permisivo para pruebas
```

### Producción
```env
RENIEC_VALIDATION_ENABLED=true
RENIEC_MIN_MATCH_SCORE=80  # Estricto
RENIEC_CACHE_ENABLED=true
RENIEC_CACHE_TTL=86400000  # 24 horas
```

## Mejores Prácticas

1. **No bloquear el registro**: Siempre permitir que el usuario se registre, solo marcar para revisión
2. **Notificar proactivamente**: Avisar al organizador cuando hay datos observados
3. **Logs completos**: Registrar todas las validaciones para auditoría
4. **Caché inteligente**: Usar caché para reducir llamadas y costos
5. **Fallback graceful**: Si RENIEC falla, continuar sin bloquear
6. **UI clara**: Mostrar al usuario que sus datos están en revisión
7. **Dashboard útil**: Dar herramientas al organizador para revisar fácilmente

## Testing

### Mock del servicio RENIEC

```typescript
// En tus tests
const mockReniecService = {
  validatePerson: jest.fn().mockResolvedValue({
    isValid: false,
    matchScore: 65,
    errorMessage: 'Datos no coinciden',
    comparisonDetails: {
      firstNameMatch: 80,
      lastNameMatch: 55,
    },
  }),
};

describe('RegistrationsService', () => {
  it('should mark person as observed when RENIEC validation fails', async () => {
    const result = await service.registerGuest(dto);

    expect(result.requiresReview).toBe(true);
    expect(result.validationScore).toBe(65);
  });
});
```
