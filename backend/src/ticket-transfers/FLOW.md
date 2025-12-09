# Flujo de Transferencia de Tickets

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INICIO DE TRANSFERENCIA                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Juan tiene ticket      │
                    │  registrationId: R-123  │
                    └─────────────────────────┘
                                  │
                                  ▼
         POST /ticket-transfers/registrations/R-123/transfer
         Body: { firstName: "Ana", lastName: "García", ... }
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         VALIDACIONES                                 │
├─────────────────────────────────────────────────────────────────────┤
│ ✓ ticket.allowsTransfer = true                                      │
│ ✓ new Date() <= ticket.transferDeadline                             │
│ ✓ registration.status = CONFIRMED                                   │
│ ✓ Sin SessionAttendance para Juan en este evento                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 │  Validaciones OK?               │
                 └────────────────┬────────────────┘
                          SI │    │ NO
                             │    │
                             │    └──► 400 Bad Request
                             │         { error: "Motivo del rechazo" }
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BUSCAR/CREAR DESTINATARIO                         │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Buscar Attendee por email o documento                            │
│    ├─ Si existe: usar existente                                     │
│    └─ Si no existe: crear nuevo                                     │
│                                                                      │
│ 2. Buscar/Crear Person para Ana                                     │
│    └─ Vincular Person ↔ Attendee                                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CREAR TICKET TRANSFER                             │
├─────────────────────────────────────────────────────────────────────┤
│ TicketTransfer {                                                     │
│   registration: R-123,                                               │
│   fromAttendee: Juan,                                                │
│   toAttendee: Ana,                                                   │
│   status: PENDING                                                    │
│ }                                                                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLETAR TRANSFERENCIA                           │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Actualizar Registration:                                         │
│    Registration.attendee = Ana                                       │
│                                                                      │
│ 2. Actualizar BlockEnrollments (si existen):                        │
│    BlockEnrollment.attendee = Ana                                    │
│                                                                      │
│ 3. Actualizar Transfer:                                             │
│    transfer.status = COMPLETED                                       │
│    transfer.completedAt = now()                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           RESULTADO                                  │
├─────────────────────────────────────────────────────────────────────┤
│ ✅ Ana es ahora titular del ticket                                  │
│ ✅ Ana puede asistir al evento                                      │
│ ✅ Ana recibirá certificados si cumple requisitos                   │
│ ✅ Historial de transferencia registrado                            │
│                                                                      │
│ ❌ Juan ya no puede usar este ticket                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Estados de la Transferencia

```
┌─────────┐
│ PENDING │ ──┐
└─────────┘   │
              │ Auto-completar
              │ (si no requiere aprobación)
              ▼
         ┌───────────┐
         │ COMPLETED │
         └───────────┘

┌─────────┐
│ PENDING │ ──────────► Usuario cancela ──► ┌───────────┐
└─────────┘                                   │ CANCELLED │
                                              └───────────┘

┌─────────┐
│ PENDING │ ──────────► Validación falla ──► ┌──────────┐
└─────────┘             (deadline pasado)      │ REJECTED │
                                               └──────────┘
```

## Secuencia de Base de Datos

### Antes de la Transferencia

```sql
-- Registration
id: R-123
attendeeId: A-Juan
eventTicketId: T-001
status: CONFIRMED
ticketCode: QR-ABC123

-- Attendee (Juan)
id: A-Juan
firstName: Juan
lastName: Pérez
email: juan@example.com

-- BlockEnrollment (si existe)
id: E-001
registrationId: R-123
attendeeId: A-Juan
blockId: B-001
```

### Después de la Transferencia

```sql
-- Registration (ACTUALIZADO)
id: R-123
attendeeId: A-Ana  ⬅ CAMBIÓ
eventTicketId: T-001
status: CONFIRMED
ticketCode: QR-ABC123  ⬅ MISMO QR CODE

-- Attendee (Juan) - Sin cambios
id: A-Juan
firstName: Juan
lastName: Pérez
email: juan@example.com

-- Attendee (Ana) - NUEVO o existente
id: A-Ana
firstName: Ana
lastName: García
email: ana@example.com

-- BlockEnrollment (ACTUALIZADO si existe)
id: E-001
registrationId: R-123
attendeeId: A-Ana  ⬅ CAMBIÓ
blockId: B-001

-- TicketTransfer (NUEVO)
id: T-001
registrationId: R-123
fromAttendeeId: A-Juan
toAttendeeId: A-Ana
status: COMPLETED
createdAt: 2024-12-05
completedAt: 2024-12-05
```

## Casos de Uso

### Caso 1: Transferencia Simple
- Juan compró ticket y no puede asistir
- Ana no existe en el sistema
- Sistema crea Ana y completa transferencia
- Ana puede asistir con el mismo QR code

### Caso 2: Transferencia a Usuario Existente
- Juan compró ticket y no puede asistir
- Ana ya tiene cuenta en el sistema
- Sistema vincula ticket a Ana existente
- Ana ve el ticket en su cuenta

### Caso 3: Transferencia con Bloques Evaluables
- Juan compró ticket con bloques educativos
- Juan ya está inscrito en BlockEnrollment
- Sistema transfiere tanto Registration como BlockEnrollment
- Ana hereda la inscripción y puede ser evaluada

### Caso 4: Transferencia Rechazada - Deadline Pasado
- Juan intenta transferir después de transferDeadline
- Sistema rechaza con mensaje: "La fecha límite para transferir ha pasado"
- Transfer se crea con status: REJECTED

### Caso 5: Transferencia Rechazada - Con Asistencia
- Juan ya asistió a una sesión del evento
- Sistema detecta SessionAttendance existente
- Rechaza con: "No se puede transferir un ticket con asistencia registrada"

## Puntos Importantes

1. **El QR Code NO cambia**: El mismo `ticketCode` ahora pertenece a Ana
2. **Atomicidad**: Todo ocurre en una transacción SERIALIZABLE
3. **Trazabilidad**: Se mantiene historial completo en TicketTransfer
4. **Identidad Unificada**: Se vincula con Person para trazabilidad a largo plazo
5. **Bloques Educativos**: Si hay enrollments, también se transfieren
6. **Validación Estricta**: Múltiples validaciones antes de permitir la transferencia

## Seguridad

- Solo el usuario autenticado puede iniciar transferencias de sus tickets
- Los admins pueden completar transferencias pendientes manualmente
- Validación de deadline a nivel de base de datos (timestamp con zona horaria)
- Transacciones SERIALIZABLE para evitar race conditions
- Auditoría completa de todas las operaciones
