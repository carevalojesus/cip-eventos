# Sistema de Seguridad de Tokens de Streaming

## Descripción General

Sistema completo de seguridad para el acceso a streaming de sesiones de eventos. Implementa tokens JWT únicos por persona y sesión con ventanas de validez temporales y límites de conexiones simultáneas.

## Características Implementadas

### 1. Tokens Únicos
- Un token JWT único por combinación de Persona + Sesión
- Los tokens se almacenan en la entidad `SessionAttendance`
- Al generar un nuevo token, el anterior se invalida automáticamente

### 2. Ventana de Validez Temporal
- **Inicio**: 15 minutos antes del inicio de la sesión (configurable)
- **Fin**: 30 minutos después del fin de la sesión (configurable)
- Validación automática en cada petición

### 3. Límite de Conexiones Simultáneas
- Por defecto: 2 conexiones simultáneas (configurable)
- Registro de IP para cada conexión
- Prevención de nuevas conexiones al alcanzar el límite

### 4. Registro de Conexiones
- Timestamp de conexión (`connectedAt`)
- Timestamp de desconexión (`disconnectedAt`)
- Duración calculada en minutos
- IP del cliente
- Almacenamiento en campo JSONB de PostgreSQL

## Configuración

Agregar las siguientes variables al archivo `.env`:

```bash
# Minutos antes del inicio de la sesión en que el token es válido
STREAMING_TOKEN_WINDOW_BEFORE_MINUTES=15

# Minutos después del fin de la sesión en que el token es válido
STREAMING_TOKEN_WINDOW_AFTER_MINUTES=30

# Número máximo de conexiones simultáneas permitidas por token
STREAMING_MAX_CONCURRENT_CONNECTIONS=2
```

## Endpoints de la API

### 1. Generar Token de Streaming

**POST** `/api/streaming/generate-token`

Genera un token único de streaming para un asistente en una sesión específica.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "attendeeId": "123e4567-e89b-12d3-a456-426614174001"
}
```

**Response:** (201 Created)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-06T17:30:00Z",
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "attendeeId": "123e4567-e89b-12d3-a456-426614174001",
  "sessionTitle": "Keynote: El Futuro de la IA",
  "sessionStartAt": "2025-12-06T15:00:00Z",
  "sessionEndAt": "2025-12-06T17:00:00Z"
}
```

**Errores:**
- `404 Not Found`: Sesión o asistente no encontrado

---

### 2. Validar Token de Streaming

**POST** `/api/streaming/validate`

Valida un token de streaming y verifica la ventana temporal.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "ip": "192.168.1.100" // Opcional
}
```

**Response:** (200 OK)
```json
{
  "valid": true,
  "message": "Token válido y dentro de la ventana de tiempo permitida",
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "attendeeId": "123e4567-e89b-12d3-a456-426614174001",
  "sessionStartAt": "2025-12-06T15:00:00Z",
  "sessionEndAt": "2025-12-06T17:00:00Z",
  "activeConnections": 1
}
```

**Response (Token Inválido):** (200 OK)
```json
{
  "valid": false,
  "message": "Token inválido o expirado"
}
```

**Response (Fuera de Ventana):** (200 OK)
```json
{
  "valid": false,
  "message": "El acceso al streaming estará disponible 15 minutos antes del inicio de la sesión",
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "attendeeId": "123e4567-e89b-12d3-a456-426614174001",
  "sessionStartAt": "2025-12-06T15:00:00Z",
  "sessionEndAt": "2025-12-06T17:00:00Z"
}
```

---

### 3. Registrar Conexión

**POST** `/api/streaming/connect`

Registra una nueva conexión al streaming.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "ip": "192.168.1.100"
}
```

**Response:** (200 OK)
```json
{
  "message": "Conexión registrada exitosamente"
}
```

**Errores:**
- `400 Bad Request`: Límite de conexiones simultáneas alcanzado
- `401 Unauthorized`: Token inválido o fuera de ventana temporal
- `404 Not Found`: Registro de asistencia no encontrado

---

### 4. Registrar Desconexión

**POST** `/api/streaming/disconnect`

Registra la desconexión de un streaming.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "ip": "192.168.1.100"
}
```

**Response:** (200 OK)
```json
{
  "message": "Desconexión registrada exitosamente"
}
```

**Errores:**
- `404 Not Found`: Registro de asistencia o conexión no encontrada

---

### 5. Obtener Conexiones Activas

**POST** `/api/streaming/active-connections`

Obtiene la lista de conexiones activas para un token.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** (200 OK)
```json
{
  "totalActive": 2,
  "maxAllowed": 2,
  "canConnect": false,
  "connections": [
    {
      "ip": "192.168.1.100",
      "connectedAt": "2025-12-06T15:05:00Z",
      "duration": 0
    },
    {
      "ip": "192.168.1.101",
      "connectedAt": "2025-12-06T15:10:00Z",
      "disconnectedAt": "2025-12-06T16:30:00Z",
      "duration": 80
    }
  ]
}
```

**Errores:**
- `401 Unauthorized`: Token inválido

---

### 6. Limpiar Conexiones Huérfanas (Admin)

**POST** `/api/streaming/cleanup-orphaned`

Cierra automáticamente conexiones que no se desconectaron correctamente.

**Headers:**
```
Authorization: Bearer {admin_jwt_token}
```

**Response:** (200 OK)
```json
{
  "message": "Limpieza de conexiones huérfanas completada"
}
```

## Estructura de Datos

### SessionAttendance Entity

```typescript
{
  id: string;
  session: EventSession;
  attendee: Attendee;

  // Token de streaming
  streamingToken: string | null;

  // Conexiones virtuales
  virtualConnections: Array<{
    connectedAt: string;
    disconnectedAt?: string;
    duration: number;
    ip?: string;
  }> | null;

  // Otros campos...
  minutesAttended: number;
  attendancePercentage: number;
}
```

### Payload del Token JWT

```typescript
{
  sessionId: string;
  attendeeId: string;
  sessionStartAt: string; // ISO 8601
  sessionEndAt: string;   // ISO 8601
  type: "streaming";
  iat: number;  // Timestamp de emisión
  exp: number;  // Timestamp de expiración
}
```

## Flujo de Uso

### 1. Generación del Token (Antes de la Sesión)

```javascript
// Frontend solicita token para el asistente
const response = await fetch('/api/streaming/generate-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId: 'session-uuid',
    attendeeId: 'attendee-uuid'
  })
});

const { token, expiresAt, sessionTitle } = await response.json();
// Guardar token en localStorage o estado de la aplicación
```

### 2. Validación Antes de Conectar

```javascript
// Validar token antes de mostrar el reproductor de streaming
const validateResponse = await fetch('/api/streaming/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: streamingToken
  })
});

const validation = await validateResponse.json();

if (!validation.valid) {
  // Mostrar mensaje de error al usuario
  console.error(validation.message);
  return;
}

// Token válido, proceder a conectar
```

### 3. Registro de Conexión

```javascript
// Al iniciar el reproductor de streaming
const connectResponse = await fetch('/api/streaming/connect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: streamingToken,
    ip: clientIP // Obtenido del cliente o autodetectado
  })
});

if (connectResponse.ok) {
  // Iniciar reproductor de streaming
  initStreamingPlayer(streamingUrl, streamingToken);
}
```

### 4. Registro de Desconexión

```javascript
// Al cerrar el reproductor o salir de la página
window.addEventListener('beforeunload', async () => {
  await fetch('/api/streaming/disconnect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: streamingToken,
      ip: clientIP
    }),
    keepalive: true // Importante para que se complete la petición
  });
});

// También al pausar o detener manualmente
stopButton.addEventListener('click', async () => {
  await disconnectStreaming();
});
```

### 5. Monitoreo de Conexiones

```javascript
// Verificar periódicamente las conexiones activas
setInterval(async () => {
  const response = await fetch('/api/streaming/active-connections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: streamingToken
    })
  });

  const { totalActive, maxAllowed, canConnect } = await response.json();

  if (totalActive >= maxAllowed) {
    // Mostrar advertencia al usuario
    showWarning('Has alcanzado el límite de conexiones simultáneas');
  }
}, 30000); // Cada 30 segundos
```

## Seguridad

### 1. Validación de Token
- El token se verifica con la clave secreta JWT
- Se valida la firma y expiración
- Se compara con el token almacenado en la base de datos

### 2. Ventana Temporal
- Protección contra acceso anticipado
- Protección contra acceso después del evento
- Configurable según necesidades del negocio

### 3. Límite de Conexiones
- Previene compartir credenciales
- Control de costos de streaming
- Mejora la experiencia del usuario legítimo

### 4. Registro de IPs
- Auditoría de conexiones
- Detección de patrones sospechosos
- Evidencia para soporte técnico

## Mantenimiento

### Limpieza Automática

Se recomienda ejecutar periódicamente la limpieza de conexiones huérfanas:

```typescript
// En un cron job o tarea programada
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_HOUR)
async cleanupConnections() {
  await this.streamingTokenService.cleanupOrphanedConnections();
}
```

### Monitoreo

Revisar los logs para:
- Conexiones exitosas y fallidas
- Intentos de acceso fuera de ventana
- Excesos de límite de conexiones
- Duración promedio de conexiones

## Mejoras Futuras

1. **Rate Limiting**: Agregar throttling para prevenir abuso de endpoints
2. **Geolocalización**: Validar que las conexiones sean del mismo país/región
3. **Calidad de Servicio**: Ajustar calidad del stream según número de conexiones
4. **Reportes**: Dashboard de analíticas de streaming
5. **Notificaciones**: Alertar al usuario cuando se alcanza el límite de conexiones
6. **Reconexión Automática**: Manejar desconexiones temporales sin consumir un slot

## Ejemplo Completo de Integración

Ver el archivo `STREAMING_INTEGRATION_EXAMPLE.md` para un ejemplo completo de integración con un reproductor de video.

## Soporte

Para problemas o preguntas sobre la implementación:
1. Revisar los logs del servicio
2. Verificar la configuración de variables de entorno
3. Consultar la documentación de la API
4. Contactar al equipo de desarrollo
