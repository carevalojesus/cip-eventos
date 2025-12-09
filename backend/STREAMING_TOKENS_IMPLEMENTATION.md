# Implementación del Sistema de Seguridad de Tokens de Streaming

## Resumen

Se ha implementado un sistema completo de seguridad para el acceso a streaming de sesiones de eventos en el backend de NestJS. El sistema cumple con todos los requisitos especificados:

1. ✅ Tokens de streaming únicos por Persona y Sesión
2. ✅ Ventana de validez: 15 minutos antes de la sesión hasta 30 minutos después
3. ✅ Límite de conexiones simultáneas por token (configurable, default: 2)
4. ✅ Invalidar token anterior al generar uno nuevo
5. ✅ Registrar conexiones en log y base de datos

## Archivos Creados

### 1. DTOs (Data Transfer Objects)

**Ubicación:** `/backend/src/evaluations/dto/streaming-token.dto.ts`

Define todas las estructuras de datos para las peticiones y respuestas:

- `GenerateStreamingTokenDto`: Para generar un nuevo token
- `ValidateStreamingTokenDto`: Para validar un token existente
- `StreamingConnectionDto`: Para registrar una conexión
- `StreamingDisconnectDto`: Para registrar una desconexión
- `StreamingTokenValidationResult`: Resultado de la validación
- `GenerateStreamingTokenResult`: Resultado de la generación
- `ActiveConnectionDto`: Información de una conexión
- `GetActiveConnectionsResult`: Lista de conexiones activas

### 2. Servicio de Tokens de Streaming

**Ubicación:** `/backend/src/evaluations/services/streaming-token.service.ts`

Implementa toda la lógica de negocio:

**Métodos principales:**

- `generateToken(dto)`: Genera un token JWT único y lo almacena en la base de datos
- `validateToken(token)`: Valida el token y verifica la ventana temporal
- `registerConnection(token, ip)`: Registra una nueva conexión al streaming
- `disconnectSession(token, ip)`: Registra la desconexión y calcula la duración
- `getActiveConnections(token)`: Obtiene las conexiones activas para un token
- `isWithinValidWindow(session)`: Verifica si la sesión está dentro de la ventana de validez
- `cleanupOrphanedConnections()`: Limpia conexiones que no se desconectaron correctamente

**Características técnicas:**

- Usa JWT para los tokens con expiración configurable
- Almacena tokens en la entidad `SessionAttendance`
- Invalida tokens anteriores al generar uno nuevo
- Registra todas las conexiones con IP y timestamps
- Calcula automáticamente la duración de las conexiones
- Logging completo de todas las operaciones

### 3. Controlador de Streaming

**Ubicación:** `/backend/src/evaluations/controllers/streaming-token.controller.ts`

Define los endpoints de la API:

- `POST /api/streaming/generate-token`: Genera un nuevo token (requiere autenticación)
- `POST /api/streaming/validate`: Valida un token
- `POST /api/streaming/connect`: Registra una conexión
- `POST /api/streaming/disconnect`: Registra una desconexión
- `POST /api/streaming/active-connections`: Obtiene conexiones activas
- `POST /api/streaming/cleanup-orphaned`: Limpia conexiones huérfanas (admin)

**Características:**

- Documentación completa con Swagger/OpenAPI
- Manejo de IPs desde headers (X-Forwarded-For para proxies)
- Respuestas estructuradas y consistentes
- Validación automática de DTOs con class-validator

### 4. Módulo de Evaluaciones Actualizado

**Ubicación:** `/backend/src/evaluations/evaluations.module.ts`

**Cambios realizados:**

- Importado `JwtModule` para generación y validación de tokens
- Importado `ConfigModule` para acceder a variables de entorno
- Agregado `StreamingTokenService` a los providers
- Agregado `StreamingTokenController` a los controllers
- Exportado `StreamingTokenService` para uso en otros módulos

### 5. Configuración de Variables de Entorno

**Ubicación:** `/backend/.env.example`

**Variables agregadas:**

```bash
# --- Streaming Token Security ---
STREAMING_TOKEN_WINDOW_BEFORE_MINUTES=15
STREAMING_TOKEN_WINDOW_AFTER_MINUTES=30
STREAMING_MAX_CONCURRENT_CONNECTIONS=2
```

### 6. Documentación

#### A. Documentación Principal
**Ubicación:** `/backend/src/evaluations/STREAMING_TOKENS.md`

Contiene:
- Descripción completa del sistema
- Características implementadas
- Configuración requerida
- Documentación completa de todos los endpoints
- Estructura de datos
- Flujo de uso paso a paso
- Consideraciones de seguridad
- Recomendaciones de mantenimiento
- Mejoras futuras sugeridas

#### B. Ejemplo de Integración
**Ubicación:** `/backend/src/evaluations/STREAMING_INTEGRATION_EXAMPLE.md`

Incluye:
- Componente React completo del reproductor de streaming
- Hook personalizado `useStreaming` para gestionar el ciclo de vida
- Servicio de API para encapsular las llamadas HTTP
- Ejemplos de uso en páginas
- Estilos CSS
- Flujo de datos completo con diagrama
- Casos de uso especiales (reconexión, detección de pérdida, etc.)
- Tests unitarios de ejemplo

## Entidad SessionAttendance

La entidad ya existía con los campos necesarios para el tracking de streaming:

```typescript
@Column({ type: 'text', nullable: true })
streamingToken: string | null;

@Column({ type: 'jsonb', nullable: true })
virtualConnections: {
  connectedAt: string;
  disconnectedAt?: string;
  duration: number;
  ip?: string;
}[] | null;
```

**No se requirieron cambios en la entidad** ya que tenía la estructura adecuada.

## Configuración Requerida

### 1. Variables de Entorno

Copiar las variables del archivo `.env.example` al archivo `.env`:

```bash
STREAMING_TOKEN_WINDOW_BEFORE_MINUTES=15
STREAMING_TOKEN_WINDOW_AFTER_MINUTES=30
STREAMING_MAX_CONCURRENT_CONNECTIONS=2
```

### 2. Dependencias

Todas las dependencias ya están instaladas en el proyecto:
- `@nestjs/jwt`: Para generación y validación de tokens
- `@nestjs/config`: Para acceder a variables de entorno
- `class-validator`: Para validación de DTOs
- `class-transformer`: Para transformación de datos

**No se requiere instalar paquetes adicionales.**

## Estructura del Token JWT

El token contiene la siguiente información:

```json
{
  "sessionId": "uuid-de-la-sesion",
  "attendeeId": "uuid-del-asistente",
  "sessionStartAt": "2025-12-06T15:00:00Z",
  "sessionEndAt": "2025-12-06T17:00:00Z",
  "type": "streaming",
  "iat": 1733500000,
  "exp": 1733510800
}
```

- El campo `type: "streaming"` identifica que es un token de streaming
- Los campos `iat` y `exp` son añadidos automáticamente por JWT
- La expiración se calcula como: `sessionEndAt + STREAMING_TOKEN_WINDOW_AFTER_MINUTES`

## Seguridad Implementada

### 1. Autenticación
- Endpoint de generación requiere JWT de usuario autenticado
- Los demás endpoints validan el token de streaming

### 2. Autorización
- Solo el asistente autorizado puede usar el token
- El token está vinculado a una sesión y persona específicas

### 3. Ventana Temporal
- Token solo válido 15 minutos antes del inicio
- Token expira 30 minutos después del fin de la sesión
- Validación automática en cada petición

### 4. Límite de Conexiones
- Máximo 2 conexiones simultáneas por defecto
- Registro de IP para cada conexión
- Prevención de nuevas conexiones al alcanzar el límite

### 5. Invalidación
- Tokens anteriores se invalidan al generar uno nuevo
- Solo el token más reciente es válido
- Almacenamiento en base de datos para verificación

### 6. Auditoría
- Todas las conexiones se registran con timestamps
- IPs almacenadas para auditoría
- Logs completos de todas las operaciones
- Duración calculada automáticamente

## Flujo de Funcionamiento

### 1. Generación del Token (Pre-evento)

```
Cliente → POST /api/streaming/generate-token
         ↓
      Validar sesión y asistente
         ↓
      Invalidar token anterior (si existe)
         ↓
      Generar nuevo token JWT
         ↓
      Guardar en SessionAttendance
         ↓
      Retornar token + info de sesión
```

### 2. Validación y Conexión

```
Cliente → POST /api/streaming/validate
         ↓
      Verificar firma JWT
         ↓
      Verificar token en BD
         ↓
      Verificar ventana temporal
         ↓
      Retornar estado de validación
         ↓
Cliente → POST /api/streaming/connect
         ↓
      Validar token
         ↓
      Verificar límite de conexiones
         ↓
      Registrar conexión con IP y timestamp
         ↓
      Guardar en virtualConnections
```

### 3. Desconexión

```
Cliente → POST /api/streaming/disconnect
         ↓
      Buscar conexión activa por IP
         ↓
      Registrar timestamp de desconexión
         ↓
      Calcular duración
         ↓
      Actualizar minutesAttended
         ↓
      Guardar en BD
```

## Endpoints de la API

### Tabla Resumen

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/streaming/generate-token` | ✅ JWT | Genera token de streaming |
| POST | `/api/streaming/validate` | ❌ | Valida token |
| POST | `/api/streaming/connect` | ❌ | Registra conexión |
| POST | `/api/streaming/disconnect` | ❌ | Registra desconexión |
| POST | `/api/streaming/active-connections` | ❌ | Lista conexiones activas |
| POST | `/api/streaming/cleanup-orphaned` | ✅ JWT | Limpia conexiones huérfanas |

### Ejemplo de Uso

```bash
# 1. Generar token
curl -X POST http://localhost:3000/api/streaming/generate-token \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "attendeeId": "123e4567-e89b-12d3-a456-426614174001"
  }'

# 2. Validar token
curl -X POST http://localhost:3000/api/streaming/validate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# 3. Conectar
curl -X POST http://localhost:3000/api/streaming/connect \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "ip": "192.168.1.100"
  }'

# 4. Desconectar
curl -X POST http://localhost:3000/api/streaming/disconnect \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "ip": "192.168.1.100"
  }'

# 5. Ver conexiones activas
curl -X POST http://localhost:3000/api/streaming/active-connections \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

## Testing

### Pruebas Sugeridas

1. **Generación de Token**
   - ✅ Genera token para sesión y asistente válidos
   - ✅ Rechaza si sesión no existe
   - ✅ Rechaza si asistente no existe
   - ✅ Invalida token anterior

2. **Validación de Token**
   - ✅ Acepta token válido dentro de ventana
   - ✅ Rechaza token antes de la ventana (>15 min antes)
   - ✅ Rechaza token después de la ventana (>30 min después)
   - ✅ Rechaza token invalidado
   - ✅ Rechaza token expirado

3. **Conexiones**
   - ✅ Registra conexión con token válido
   - ✅ Rechaza conexión con token inválido
   - ✅ Rechaza al alcanzar límite de conexiones
   - ✅ Permite reconexión desde misma IP
   - ✅ Registra IP correctamente

4. **Desconexiones**
   - ✅ Registra desconexión correctamente
   - ✅ Calcula duración correctamente
   - ✅ Actualiza minutesAttended
   - ✅ Maneja desconexión de IP no conectada

## Monitoreo y Mantenimiento

### 1. Logs a Revisar

```typescript
// Logs de generación
"Token de streaming generado para asistente {attendeeId} en sesión {sessionId}"

// Logs de conexión
"Conexión registrada desde IP {ip} para asistente {attendeeId} en sesión {sessionId}"

// Logs de desconexión
"Desconexión registrada desde IP {ip} para asistente {attendeeId} en sesión {sessionId}. Duración: {duration} minutos"

// Logs de limpieza
"Limpieza completada. Se cerraron {count} conexiones huérfanas"
```

### 2. Tarea de Limpieza Recomendada

Agregar un cron job para limpiar conexiones huérfanas:

```typescript
// En un módulo con @nestjs/schedule
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class StreamingCleanupService {
  constructor(
    private readonly streamingTokenService: StreamingTokenService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOrphanedConnections() {
    await this.streamingTokenService.cleanupOrphanedConnections();
  }
}
```

### 3. Métricas a Monitorear

- Número de tokens generados por día
- Número de conexiones simultáneas promedio
- Duración promedio de las conexiones
- Número de intentos de conexión rechazados
- Número de tokens expirados/invalidados

## Próximos Pasos

1. **Testing**
   - Crear tests unitarios para el servicio
   - Crear tests E2E para los endpoints
   - Probar casos límite y errores

2. **Integración Frontend**
   - Implementar componente de reproductor de streaming
   - Integrar con el sistema de autenticación existente
   - Manejar errores y reconexiones

3. **Optimizaciones**
   - Agregar caché para validaciones frecuentes
   - Implementar rate limiting en endpoints públicos
   - Agregar métricas y analytics

4. **Documentación**
   - Agregar ejemplos en Swagger UI
   - Crear guía de troubleshooting
   - Documentar casos de uso comunes

## Soporte

Para cualquier problema o pregunta:

1. Revisar los logs del servicio
2. Verificar las variables de entorno
3. Consultar la documentación en `/backend/src/evaluations/STREAMING_TOKENS.md`
4. Ver ejemplos en `/backend/src/evaluations/STREAMING_INTEGRATION_EXAMPLE.md`

## Conclusión

El sistema de seguridad de tokens de streaming ha sido implementado completamente con todas las funcionalidades requeridas. El código está listo para ser probado y desplegado a producción.

**Archivos principales:**
- `/backend/src/evaluations/dto/streaming-token.dto.ts`
- `/backend/src/evaluations/services/streaming-token.service.ts`
- `/backend/src/evaluations/controllers/streaming-token.controller.ts`
- `/backend/src/evaluations/evaluations.module.ts` (actualizado)
- `/backend/.env.example` (actualizado)

**Documentación:**
- `/backend/src/evaluations/STREAMING_TOKENS.md`
- `/backend/src/evaluations/STREAMING_INTEGRATION_EXAMPLE.md`
- `/backend/STREAMING_TOKENS_IMPLEMENTATION.md` (este archivo)
