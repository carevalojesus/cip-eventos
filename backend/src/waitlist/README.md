# Sistema de Lista de Espera (Waitlist)

## Descripción

Sistema completo de lista de espera que permite a los usuarios unirse a una cola cuando un ticket se agota, con invitaciones automáticas y gestión de prioridad FIFO.

## Características

### Estados de Lista de Espera

- **WAITING**: En espera en la cola
- **INVITED**: Invitado a comprar (link de compra enviado)
- **CONVERTED**: Convirtió la invitación en inscripción exitosa
- **EXPIRED**: Invitación venció sin comprar
- **CANCELLED**: Usuario se salió de la lista

### Flujo de Trabajo

1. **Usuario se une a la lista de espera**
   - Solo cuando el ticket está agotado
   - Solo si el ticket permite lista de espera (`allowsWaitlist: true`)
   - Se asigna prioridad FIFO (First In, First Out)

2. **Stock se libera**
   - Cuando expira una reserva pendiente
   - El sistema invita automáticamente al primero en la lista

3. **Invitación enviada**
   - Se genera un token único de compra
   - Email con link de compra válido por X horas (configurable)
   - Estado cambia a `INVITED`

4. **Usuario completa la compra**
   - Valida el token en el proceso de registro
   - Estado cambia a `CONVERTED`

5. **Invitación expira**
   - CRON automático detecta invitaciones vencidas
   - Estado cambia a `EXPIRED`
   - Se invita al siguiente en la lista

## API Endpoints

### POST /waitlist
Unirse a la lista de espera.

**Rate Limit**: 3 requests por minuto

**Body**:
```json
{
  "ticketId": "uuid",
  "personId": "uuid",
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "message": "Te has unido a la lista de espera exitosamente",
  "waitlistId": "uuid",
  "position": 5,
  "status": "WAITING"
}
```

### DELETE /waitlist/:ticketId
Salirse de la lista de espera.

**Auth**: Requiere JWT

**Response**:
```json
{
  "message": "Te has salido de la lista de espera"
}
```

### GET /waitlist/:ticketId/position
Ver mi posición en la lista.

**Auth**: Requiere JWT

**Response**:
```json
{
  "position": 5,
  "totalInQueue": 20,
  "status": "WAITING"
}
```

### GET /waitlist/:ticketId/count
Ver cuántos hay en espera (público).

**Auth**: Público

**Response**:
```json
{
  "ticketId": "uuid",
  "waitlistCount": 20
}
```

### POST /waitlist/validate-token/:token
Validar token de compra.

**Auth**: Público (usado desde el email)

**Response**:
```json
{
  "valid": true,
  "ticketId": "uuid",
  "ticketName": "General",
  "personId": "uuid",
  "expiresAt": "2024-12-10T15:00:00Z",
  "email": "user@example.com"
}
```

## Integración

### Con RegistrationsService

El `RegistrationsService` llama automáticamente a `waitlistService.onStockReleased()` cuando expira una reserva:

```typescript
// En expirePendingRegistrations()
if (reg.eventTicket && reg.eventTicket.allowsWaitlist) {
  await this.waitlistService.onStockReleased(reg.eventTicket.id);
}
```

### Con flujo de Registro

En el proceso de compra, validar el token de lista de espera:

```typescript
// Validar token si viene de lista de espera
const entry = await waitlistService.validateToken(token);

// Después de completar el registro exitosamente
await waitlistService.convertToRegistration(token);
```

## Configuración

### EventTicket

Campo `waitlistInvitationHours` (default: 24):
- Horas válidas para el link de compra
- Configurable por ticket

```typescript
const ticket = {
  name: "General",
  allowsWaitlist: true,
  waitlistInvitationHours: 48 // 48 horas para completar compra
}
```

## CRON Jobs

### Procesar invitaciones expiradas

**Frecuencia**: Cada hora

**Función**: `processExpiredInvitations()`

**Acciones**:
1. Busca invitaciones con `status: INVITED` y `invitationExpiresAt < now`
2. Cambia estado a `EXPIRED`
3. Invita al siguiente en la lista automáticamente

## Base de Datos

### Tabla: waitlist_entries

```sql
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY,
  eventTicketId UUID REFERENCES event_tickets,
  personId UUID REFERENCES persons,
  email TEXT NOT NULL,
  status ENUM('WAITING', 'INVITED', 'CONVERTED', 'EXPIRED', 'CANCELLED'),
  priority INTEGER NOT NULL,
  purchaseToken TEXT UNIQUE,
  invitedAt TIMESTAMP WITH TIME ZONE,
  invitationExpiresAt TIMESTAMP WITH TIME ZONE,
  convertedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Índices

- `(eventTicketId, status)` - Queries por ticket y estado
- `(eventTicketId, status, priority)` - Obtener siguiente en lista (FIFO)
- `(purchaseToken)` - Validación de token (único)
- `(personId, eventTicketId)` - Prevenir duplicados (único)

## Validaciones

### Al unirse a la lista

1. ✅ Ticket existe y está activo
2. ✅ Ticket permite lista de espera (`allowsWaitlist: true`)
3. ✅ Ticket está agotado (reservedCount >= stock)
4. ✅ Persona existe
5. ✅ Persona no está ya en la lista
6. ✅ Persona no está ya registrada en el evento

### Al invitar

1. ✅ Busca el primero en espera (menor prioridad)
2. ✅ Genera token único seguro (UUID v4)
3. ✅ Calcula expiración basada en `waitlistInvitationHours`
4. ✅ Envía email con link de compra

### Al validar token

1. ✅ Token existe
2. ✅ Estado es `INVITED`
3. ✅ Invitación no ha expirado

## Seguridad

- **Rate limiting**: 3 requests/minuto en endpoint de join
- **Tokens únicos**: UUID v4 para links de compra
- **Índices únicos**: Previenen duplicados en BD
- **Validación de expiración**: Tokens inválidos después de X horas

## Emails (TODO)

### Email de confirmación
Enviado cuando el usuario se une a la lista.

**Contenido**:
- Confirmación de entrada a lista
- Posición actual en la cola
- Información del ticket/evento

### Email de invitación
Enviado cuando se libera un cupo.

**Contenido**:
- Link de compra con token único
- Fecha de expiración del link
- Información del ticket/evento
- Call to action claro

### Email de expiración
Enviado cuando la invitación expira.

**Contenido**:
- Notificación de expiración
- Opción de volver a la lista

## Testing

### Casos de prueba recomendados

1. **Join waitlist**: Validar todas las reglas de negocio
2. **FIFO order**: Verificar orden correcto de invitaciones
3. **Token expiration**: Simular expiración y auto-invitación
4. **Stock release**: Verificar integración con registrations
5. **Concurrent requests**: Prevenir race conditions
6. **Duplicate prevention**: Validar índices únicos

## Monitoreo

### Logs importantes

- `✅ {email} se unió a la lista de espera del ticket {name} (prioridad: {n})`
- `📧 Invitación enviada a {email} para ticket {name} (expira en {n}h)`
- `✅ {email} convirtió su invitación en inscripción`
- `❌ Invitación expirada: {email} - Ticket: {name}`
- `🔔 Stock liberado para ticket {id}, verificando lista de espera...`

## Próximas mejoras

- [ ] Implementar envío real de emails
- [ ] Dashboard para administradores
- [ ] Notificaciones push
- [ ] Métricas de conversión
- [ ] Tests automatizados
- [ ] Límite máximo de lista de espera por ticket
- [ ] Prioridad VIP (skipear la cola)
