# Módulo de Transferencia de Tickets

## Descripción

Este módulo permite a los usuarios transferir sus tickets a otras personas cuando no puedan asistir a un evento. Implementa todas las validaciones de negocio necesarias y mantiene un historial completo de transferencias.

## Flujo de Negocio

### Escenario
Juan compró una entrada para un evento pero no puede asistir. Quiere transferir su ticket a Ana.

### Proceso
1. Juan inicia la transferencia proporcionando los datos de Ana
2. El sistema valida que:
   - El ticket permite transferencias (`allowsTransfer = true`)
   - La transferencia se realiza antes del `transferDeadline`
   - Juan no tiene asistencia registrada al evento
   - El ticket está confirmado (pagado)
3. Si Ana no existe en el sistema:
   - Se crea un registro de `Attendee` para Ana
   - Se crea un registro de `Person` para Ana
4. Se crea un registro de `TicketTransfer` con estado `PENDING`
5. La transferencia se completa automáticamente:
   - Se actualiza `Registration.attendee` de Juan a Ana
   - Se actualizan los `BlockEnrollment` si existen
   - Se marca la transferencia como `COMPLETED`
6. Ana es ahora la titular del ticket y puede:
   - Asistir al evento
   - Recibir certificados si cumple los requisitos

## Entidades

### TicketTransfer

```typescript
{
  id: string;
  registration: Registration;        // El ticket que se transfiere
  fromAttendee: Attendee;           // Quien transfiere (Juan)
  toAttendee: Attendee;             // Quien recibe (Ana)
  fromPerson: Person | null;        // Identidad unificada de Juan
  toPerson: Person | null;          // Identidad unificada de Ana
  status: TransferStatus;           // PENDING | COMPLETED | CANCELLED | REJECTED
  reason: string | null;            // Motivo de la transferencia
  rejectionReason: string | null;   // Motivo del rechazo (si aplica)
  initiatedBy: User | null;         // Usuario que inició (puede ser null si invitado)
  approvedBy: User | null;          // Admin que aprobó (si requiere aprobación)
  transferToken: string | null;     // Token para confirmar (futuro)
  tokenExpiresAt: Date | null;      // Expiración del token
  createdAt: Date;
  completedAt: Date | null;
}
```

## Endpoints

### POST /ticket-transfers/registrations/:id/transfer
Inicia una transferencia de ticket.

**Requiere autenticación**: Sí

**Body**:
```json
{
  "firstName": "Ana",
  "lastName": "García",
  "email": "ana@example.com",
  "documentType": "DNI",
  "documentNumber": "87654321",
  "phone": "+51987654321",
  "reason": "No puedo asistir por trabajo"
}
```

**Response**:
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "registration": {...},
  "fromAttendee": {...},
  "toAttendee": {...},
  "createdAt": "2024-12-05T...",
  "completedAt": "2024-12-05T..."
}
```

### POST /ticket-transfers/:id/complete
Completa una transferencia pendiente.

**Requiere autenticación**: Sí (ORG_ADMIN, SUPER_ADMIN)

**Response**: TicketTransfer actualizado

### POST /ticket-transfers/:id/cancel
Cancela una transferencia pendiente.

**Requiere autenticación**: Sí

**Response**: TicketTransfer actualizado

### GET /ticket-transfers/registrations/:id/can-transfer
Valida si un ticket puede ser transferido.

**Requiere autenticación**: No (público)

**Response**:
```json
{
  "canTransfer": true,
  "reason": "El ticket puede ser transferido",
  "deadline": "2024-12-20T00:00:00Z",
  "allowsTransfer": true,
  "hasAttendance": false,
  "isConfirmed": true,
  "isDeadlinePassed": false
}
```

### GET /ticket-transfers/registrations/:id/history
Obtiene el historial de transferencias de un ticket.

**Requiere autenticación**: Sí

**Response**:
```json
[
  {
    "id": "uuid",
    "status": "COMPLETED",
    "registrationId": "uuid",
    "fromAttendeeName": "Juan Pérez",
    "toAttendeeName": "Ana García",
    "reason": "No puedo asistir por trabajo",
    "rejectionReason": null,
    "createdAt": "2024-12-05T...",
    "completedAt": "2024-12-05T...",
    "eventName": "Congreso Internacional 2024",
    "ticketName": "General"
  }
]
```

## Validaciones

El sistema valida automáticamente:

1. **Ticket permite transferencias**: `EventTicket.allowsTransfer = true`
2. **Dentro del deadline**: `new Date() <= EventTicket.transferDeadline`
3. **Sin asistencia registrada**: No existe `SessionAttendance` para el asistente en ese evento
4. **Ticket confirmado**: `Registration.status = CONFIRMED`

Si alguna validación falla, se lanza una excepción con el mensaje apropiado.

## Estados de Transferencia

- **PENDING**: Transferencia creada, esperando completarse
- **COMPLETED**: Transferencia completada exitosamente
- **CANCELLED**: Transferencia cancelada por el usuario
- **REJECTED**: Transferencia rechazada por el sistema (deadline pasado, tiene asistencia, etc.)

## Internacionalización

El módulo soporta mensajes en español e inglés. Los archivos de traducción están en:
- `/src/i18n/es/transfers.json`
- `/src/i18n/en/transfers.json`

## Migración de Base de Datos

Para crear la tabla `ticket_transfers`, ejecuta:

```bash
npm run migration:run
```

La migración está en: `/src/database/migrations/1733440000000-CreateTicketTransfersTable.ts`

## Ejemplo de Uso en Frontend

```typescript
// Verificar si puede transferir
const validation = await api.get(`/ticket-transfers/registrations/${registrationId}/can-transfer`);

if (validation.canTransfer) {
  // Mostrar formulario de transferencia
  const transferData = {
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana@example.com',
    documentType: 'DNI',
    documentNumber: '87654321',
    reason: 'No puedo asistir'
  };

  const transfer = await api.post(
    `/ticket-transfers/registrations/${registrationId}/transfer`,
    transferData
  );

  console.log('Transferencia completada:', transfer);
} else {
  // Mostrar mensaje de error
  console.error(validation.reason);
}
```

## Características Futuras

- [ ] Aprobación manual de transferencias por organizador
- [ ] Notificaciones por email al nuevo titular
- [ ] Token de confirmación para el destinatario
- [ ] Límite de transferencias por ticket
- [ ] Trazabilidad en auditoría
- [ ] Políticas de transferencia configurables por evento
