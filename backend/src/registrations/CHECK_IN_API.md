# Sistema de Check-In por QR - Documentación API

## Descripción General

Sistema completo de check-in por código QR para eventos y sesiones. Soporta dos modos de operación:

- **Modo Simple**: Solo registra entrada (check-in)
- **Modo Avanzado**: Registra entrada y salida (check-in/check-out) con cálculo de tiempo de asistencia

## Endpoints Disponibles

### Base URL
```
/api/registrations/qr
```

### Autenticación
Todos los endpoints requieren:
- JWT válido en header `Authorization: Bearer <token>`
- Rol: `ADMIN`, `STAFF`, o `ORGANIZER`

---

## 1. Check-In (Entrada)

Registra la entrada de un asistente al evento o a una sesión específica.

### Endpoint
```http
POST /api/registrations/qr/check-in
```

### Request Body
```json
{
  "ticketCode": "uuid-del-ticket",
  "sessionId": "uuid-de-sesion-opcional",
  "mode": "simple"
}
```

### Parámetros

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ticketCode` | string | Sí | Código único del ticket (UUID) obtenido del QR |
| `sessionId` | string (UUID) | No | ID de la sesión específica. Si se omite, hace check-in general al evento |
| `mode` | enum | No | `"simple"` o `"advanced"`. Por defecto: `"simple"` |

### Respuestas

#### ✅ Check-in exitoso (primera vez)
```json
{
  "success": true,
  "message": "Check-in registrado exitosamente",
  "isReentry": false,
  "attendee": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "documentNumber": "12345678"
  },
  "event": "Congreso Internacional de Ingeniería 2025",
  "checkInTime": "2025-01-20T09:30:00.000Z"
}
```

#### 🔄 Reingreso detectado
```json
{
  "success": true,
  "message": "Reingreso detectado. Última entrada: 09:30",
  "isReentry": true,
  "attendee": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "documentNumber": "12345678"
  },
  "event": "Congreso Internacional de Ingeniería 2025",
  "checkInTime": "2025-01-20T09:30:00.000Z",
  "currentTime": "2025-01-20T11:15:00.000Z"
}
```

#### ✅ Check-in a sesión exitoso
```json
{
  "success": true,
  "message": "Check-in registrado exitosamente",
  "isReentry": false,
  "attendee": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "documentNumber": "12345678"
  },
  "session": {
    "id": "session-uuid",
    "title": "Keynote: El Futuro de la IA",
    "startAt": "2025-01-20T09:00:00.000Z",
    "endAt": "2025-01-20T11:00:00.000Z"
  },
  "checkInTime": "2025-01-20T09:15:00.000Z",
  "attendance": {
    "id": "attendance-uuid",
    "status": "PRESENT",
    "modality": "IN_PERSON"
  }
}
```

#### ❌ Error: Ticket no encontrado
```json
{
  "statusCode": 404,
  "message": "Entrada no encontrada"
}
```

#### ❌ Error: Ticket no confirmado
```json
{
  "statusCode": 400,
  "message": "El ticket no ha sido confirmado. Estado actual: PENDING"
}
```

#### ❌ Error: Sesión no encontrada
```json
{
  "statusCode": 404,
  "message": "Sesión no encontrada"
}
```

---

## 2. Check-Out (Salida)

Registra la salida de un asistente de una sesión específica. Calcula automáticamente el tiempo de asistencia y porcentaje.

### Endpoint
```http
POST /api/registrations/qr/check-out
```

### Request Body
```json
{
  "ticketCode": "uuid-del-ticket",
  "sessionId": "uuid-de-sesion"
}
```

### Parámetros

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ticketCode` | string | Sí | Código único del ticket (UUID) |
| `sessionId` | string (UUID) | Sí | ID de la sesión de la cual se hace check-out |

### Respuestas

#### ✅ Check-out exitoso
```json
{
  "success": true,
  "message": "Check-out registrado exitosamente",
  "attendee": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com"
  },
  "session": {
    "id": "session-uuid",
    "title": "Keynote: El Futuro de la IA"
  },
  "checkInTime": "2025-01-20T09:15:00.000Z",
  "checkOutTime": "2025-01-20T10:45:00.000Z",
  "minutesAttended": 90,
  "attendancePercentage": 75.0
}
```

#### ❌ Error: No hay check-in registrado
```json
{
  "statusCode": 400,
  "message": "No se ha registrado entrada a esta sesión"
}
```

#### ❌ Error: Ya hizo check-out
```json
{
  "statusCode": 400,
  "message": "Ya registró salida de esta sesión a las 10:45"
}
```

---

## 3. Consultar Estado de Ticket

Obtiene el historial completo de check-in/check-out de un ticket.

### Endpoint
```http
GET /api/registrations/qr/:ticketCode/status
```

### Parámetros de URL

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ticketCode` | string | Código único del ticket (UUID) |

### Respuesta

```json
{
  "ticketCode": "uuid-del-ticket",
  "attendee": {
    "id": "attendee-uuid",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "documentNumber": "12345678"
  },
  "event": {
    "id": "event-uuid",
    "title": "Congreso Internacional de Ingeniería 2025"
  },
  "eventCheckIn": {
    "attended": true,
    "attendedAt": "2025-01-20T09:15:00.000Z"
  },
  "sessionAttendances": [
    {
      "sessionId": "session-uuid-1",
      "sessionTitle": "Keynote: El Futuro de la IA",
      "checkInAt": "2025-01-20T09:15:00.000Z",
      "checkOutAt": "2025-01-20T10:45:00.000Z",
      "status": "PRESENT",
      "modality": "IN_PERSON",
      "minutesAttended": 90,
      "attendancePercentage": 75.0
    },
    {
      "sessionId": "session-uuid-2",
      "sessionTitle": "Workshop: Machine Learning Práctico",
      "checkInAt": "2025-01-20T14:00:00.000Z",
      "checkOutAt": null,
      "status": "PRESENT",
      "modality": "IN_PERSON",
      "minutesAttended": 0,
      "attendancePercentage": 0
    }
  ]
}
```

---

## 4. Validar Ticket (Sin Registrar Check-In)

Valida un ticket sin registrar el check-in. Útil para pre-validación antes del escaneo.

### Endpoint
```http
GET /api/registrations/qr/:ticketCode/validate
```

### Parámetros de URL

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ticketCode` | string | Código único del ticket (UUID) |

### Respuesta

```json
{
  "valid": true,
  "ticketCode": "uuid-del-ticket",
  "attendee": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "documentNumber": "12345678"
  },
  "event": {
    "id": "event-uuid",
    "title": "Congreso Internacional de Ingeniería 2025"
  },
  "eventTicket": {
    "id": "ticket-type-uuid",
    "name": "Entrada General"
  },
  "status": "CONFIRMED",
  "attended": false,
  "attendedAt": null
}
```

---

## Flujos de Uso

### Flujo 1: Check-In Simple al Evento

1. **Escanear QR** del ticket para obtener `ticketCode`
2. **Validar ticket** (opcional):
   ```
   GET /api/registrations/qr/{ticketCode}/validate
   ```
3. **Registrar check-in**:
   ```
   POST /api/registrations/qr/check-in
   Body: { "ticketCode": "..." }
   ```
4. Mostrar confirmación al usuario

### Flujo 2: Check-In a Sesión Específica

1. **Escanear QR** del ticket
2. **Seleccionar sesión** del evento
3. **Registrar check-in a sesión**:
   ```
   POST /api/registrations/qr/check-in
   Body: {
     "ticketCode": "...",
     "sessionId": "...",
     "mode": "simple"
   }
   ```

### Flujo 3: Check-In/Out Avanzado con Cálculo de Tiempo

1. **Escanear QR** al entrar
2. **Registrar check-in**:
   ```
   POST /api/registrations/qr/check-in
   Body: {
     "ticketCode": "...",
     "sessionId": "...",
     "mode": "advanced"
   }
   ```
3. **Escanear QR** al salir
4. **Registrar check-out**:
   ```
   POST /api/registrations/qr/check-out
   Body: {
     "ticketCode": "...",
     "sessionId": "..."
   }
   ```
5. Sistema calcula automáticamente:
   - Minutos asistidos
   - Porcentaje de asistencia

### Flujo 4: Consultar Historial

```
GET /api/registrations/qr/{ticketCode}/status
```

Retorna todo el historial de asistencia del ticket.

---

## Estados de Ticket

| Estado | Descripción | Check-In Permitido |
|--------|-------------|-------------------|
| `CONFIRMED` | Ticket confirmado y pagado | ✅ Sí |
| `PENDING` | Pendiente de pago | ❌ No |
| `CANCELLED` | Cancelado | ❌ No |
| `ATTENDED` | Ya asistió | ✅ Sí (reingreso) |
| `EXPIRED` | Expiró sin pagar | ❌ No |

---

## Estados de Asistencia (SessionAttendance)

| Estado | Descripción |
|--------|-------------|
| `PRESENT` | Asistencia completa |
| `PARTIAL` | Asistencia parcial |
| `ABSENT` | Ausente |
| `LATE` | Tardanza |
| `EXCUSED` | Falta justificada |

---

## Modalidades de Asistencia

| Modalidad | Descripción |
|-----------|-------------|
| `IN_PERSON` | Presencial |
| `VIRTUAL` | Virtual |
| `HYBRID` | Híbrido (parte presencial, parte virtual) |

---

## Rate Limiting

- **Check-in/Check-out**: 30 solicitudes por minuto por usuario
- Protección contra abuso y escaneos accidentales múltiples

---

## Logs del Sistema

El sistema registra automáticamente:

- ✅ Check-in exitoso con nombre completo y evento/sesión
- 🔄 Reingresos detectados con hora previa
- ⚠️ Check-in antes del inicio de sesión (advertencia)
- 🚪 Check-out exitoso con minutos asistidos
- ❌ Errores de validación

Ejemplo de log:
```
✅ Check-in exitoso: Juan Pérez - Congreso Internacional de Ingeniería 2025
🔄 Reingreso detectado: juan.perez@email.com - Última entrada: 09:30
⚠️ Check-in antes de inicio: juan.perez@email.com - Sesión inicia a las 09:00
🚪 Check-out exitoso: Juan Pérez - Keynote: El Futuro de la IA - 90 minutos
```

---

## Ejemplo de Integración con QR Scanner

### Frontend (React/Vue/Angular)

```typescript
// 1. Escanear QR
const ticketCode = await scanQR(); // Retorna UUID del ticket

// 2. Validar ticket
const validation = await fetch(
  `/api/registrations/qr/${ticketCode}/validate`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

if (!validation.valid) {
  showError('Ticket inválido');
  return;
}

// 3. Mostrar información del asistente
showAttendeeInfo(validation.attendee);

// 4. Confirmar y hacer check-in
const response = await fetch('/api/registrations/qr/check-in', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    ticketCode,
    sessionId: selectedSessionId // Opcional
  })
});

if (response.success) {
  showSuccess(`Bienvenido ${response.attendee.firstName}!`);

  if (response.isReentry) {
    showWarning('Reingreso detectado');
  }
}
```

---

## Notas Importantes

1. **Validación de Estado**: Solo tickets con estado `CONFIRMED` o `ATTENDED` pueden hacer check-in
2. **Reingresos**: El sistema permite reingresos pero los marca claramente
3. **Check-in Anticipado**: Se permite check-in antes del inicio de sesión (con advertencia en logs)
4. **Cálculo Automático**: El sistema calcula automáticamente:
   - Duración de sesión
   - Minutos asistidos
   - Porcentaje de asistencia
5. **Auditoría**: El campo `registeredBy` registra qué usuario del staff hizo el check-in
6. **Actualización Automática**: Al hacer check-in a una sesión, también se marca el check-in general del evento

---

## Seguridad

- ✅ Autenticación JWT requerida
- ✅ Control de roles (ADMIN, STAFF, ORGANIZER)
- ✅ Rate limiting para prevenir abuso
- ✅ Validación de relaciones (sesión pertenece al evento del ticket)
- ✅ Logs completos para auditoría
- ✅ Validación de DTOs con class-validator

---

## Soporte

Para preguntas o problemas:
- Email: carevalojesus@gmail.com
- GitHub: @carevalojesus
