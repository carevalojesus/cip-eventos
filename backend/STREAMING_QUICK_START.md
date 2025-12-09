# Guía Rápida: Sistema de Tokens de Streaming

## Configuración Inicial (5 minutos)

### 1. Agregar Variables de Entorno

Edita tu archivo `.env` y agrega:

```bash
# Streaming Token Security
STREAMING_TOKEN_WINDOW_BEFORE_MINUTES=15
STREAMING_TOKEN_WINDOW_AFTER_MINUTES=30
STREAMING_MAX_CONCURRENT_CONNECTIONS=2
```

### 2. Verificar que Existe JWT_SECRET

Asegúrate de que tu `.env` tenga configurado `JWT_SECRET`:

```bash
JWT_SECRET=tu_clave_secreta_aqui
```

### 3. Compilar y Ejecutar

```bash
npm run build
npm run start:dev
```

El servidor debería iniciar sin errores y mostrar los nuevos endpoints en la consola.

## Prueba Rápida con cURL

### 1. Generar un Token

Primero, necesitas autenticarte y obtener un token de usuario:

```bash
# Login (ajusta según tu endpoint de autenticación)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123"
  }'
```

Guarda el token JWT que recibes.

### 2. Crear una Sesión de Prueba (si no existe)

```bash
# Ajusta según tus datos de prueba
SESSION_ID="tu-session-id-aqui"
ATTENDEE_ID="tu-attendee-id-aqui"
```

### 3. Generar Token de Streaming

```bash
curl -X POST http://localhost:3000/api/streaming/generate-token \
  -H "Authorization: Bearer TU_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "attendeeId": "'"$ATTENDEE_ID"'"
  }'
```

Deberías recibir algo como:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-06T17:30:00Z",
  "sessionId": "...",
  "attendeeId": "...",
  "sessionTitle": "Mi Sesión de Prueba",
  "sessionStartAt": "2025-12-06T15:00:00Z",
  "sessionEndAt": "2025-12-06T17:00:00Z"
}
```

Guarda el `token` que recibes.

### 4. Validar el Token

```bash
curl -X POST http://localhost:3000/api/streaming/validate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TU_STREAMING_TOKEN_AQUI"
  }'
```

### 5. Conectar al Streaming

```bash
curl -X POST http://localhost:3000/api/streaming/connect \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TU_STREAMING_TOKEN_AQUI",
    "ip": "192.168.1.100"
  }'
```

### 6. Ver Conexiones Activas

```bash
curl -X POST http://localhost:3000/api/streaming/active-connections \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TU_STREAMING_TOKEN_AQUI"
  }'
```

### 7. Desconectar

```bash
curl -X POST http://localhost:3000/api/streaming/disconnect \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TU_STREAMING_TOKEN_AQUI",
    "ip": "192.168.1.100"
  }'
```

## Prueba con Postman/Thunder Client

### Importar Colección

Crea una colección con estos requests:

#### 1. Generate Token
- **Método**: POST
- **URL**: `{{baseUrl}}/streaming/generate-token`
- **Headers**:
  - `Authorization: Bearer {{userToken}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "sessionId": "{{sessionId}}",
  "attendeeId": "{{attendeeId}}"
}
```

#### 2. Validate Token
- **Método**: POST
- **URL**: `{{baseUrl}}/streaming/validate`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "token": "{{streamingToken}}"
}
```

#### 3. Connect
- **Método**: POST
- **URL**: `{{baseUrl}}/streaming/connect`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "token": "{{streamingToken}}",
  "ip": "192.168.1.100"
}
```

#### 4. Active Connections
- **Método**: POST
- **URL**: `{{baseUrl}}/streaming/active-connections`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "token": "{{streamingToken}}"
}
```

#### 5. Disconnect
- **Método**: POST
- **URL**: `{{baseUrl}}/streaming/disconnect`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "token": "{{streamingToken}}",
  "ip": "192.168.1.100"
}
```

### Variables de Entorno en Postman

```
baseUrl: http://localhost:3000/api
userToken: (tu JWT de usuario)
sessionId: (ID de una sesión válida)
attendeeId: (ID de un asistente válido)
streamingToken: (se actualizará después de generar)
```

## Verificar en la Base de Datos

### Ver Tokens Generados

```sql
SELECT
  sa.id,
  sa."streamingToken",
  e.email as attendee_email,
  es.title as session_title,
  sa."virtualConnections",
  sa."minutesAttended"
FROM session_attendances sa
JOIN attendees e ON sa."attendeeId" = e.id
JOIN event_sessions es ON sa."sessionId" = es.id
WHERE sa."streamingToken" IS NOT NULL;
```

### Ver Conexiones Activas

```sql
SELECT
  sa.id,
  e.email,
  es.title,
  jsonb_array_length(sa."virtualConnections") as total_connections,
  sa."virtualConnections"
FROM session_attendances sa
JOIN attendees e ON sa."attendeeId" = e.id
JOIN event_sessions es ON sa."sessionId" = es.id
WHERE sa."virtualConnections" IS NOT NULL
  AND jsonb_array_length(sa."virtualConnections") > 0;
```

## Casos de Prueba

### 1. Token Válido Dentro de Ventana
- Crear sesión que empiece en 10 minutos
- Generar token
- Validar token (debería ser válido)
- Conectar (debería funcionar)

### 2. Token Fuera de Ventana
- Crear sesión que ya terminó hace 1 hora
- Generar token
- Validar token (debería rechazar)

### 3. Límite de Conexiones
- Generar token
- Conectar desde IP 1 (debería funcionar)
- Conectar desde IP 2 (debería funcionar)
- Conectar desde IP 3 (debería rechazar)

### 4. Invalidación de Token Anterior
- Generar token 1
- Validar token 1 (válido)
- Generar token 2 (nuevo token)
- Validar token 1 (debería ser inválido)
- Validar token 2 (debería ser válido)

### 5. Registro de Duración
- Generar token
- Conectar
- Esperar 5 minutos
- Desconectar
- Verificar en BD que duración sea ~5 minutos

## Troubleshooting

### Error: "Sesión no encontrada"
- Verificar que el sessionId existe en la tabla `event_sessions`
- Usar un UUID válido

### Error: "Asistente no encontrado"
- Verificar que el attendeeId existe en la tabla `attendees`
- Usar un UUID válido

### Error: "Token inválido o expirado"
- Verificar que usas el token más reciente
- Verificar que la sesión está dentro de la ventana temporal
- Revisar las variables de entorno STREAMING_TOKEN_WINDOW_*

### Error: "Límite de conexiones alcanzado"
- Desconectar otras conexiones primero
- O aumentar STREAMING_MAX_CONCURRENT_CONNECTIONS

### Error: "Authorization header missing"
- El endpoint generate-token requiere autenticación
- Incluir header: `Authorization: Bearer {userToken}`

## Logs a Revisar

Los logs aparecen con el prefijo `[StreamingTokenService]`:

```
[StreamingTokenService] Token de streaming generado para asistente xxx en sesión yyy
[StreamingTokenService] Conexión registrada desde IP 192.168.1.100 para asistente xxx en sesión yyy
[StreamingTokenService] Desconexión registrada desde IP 192.168.1.100... Duración: 15 minutos
```

## Swagger/OpenAPI

Una vez el servidor esté corriendo, visita:

```
http://localhost:3000/api
```

Deberías ver todos los endpoints de streaming documentados con ejemplos.

## Próximos Pasos

1. **Integración Frontend**: Ver `STREAMING_INTEGRATION_EXAMPLE.md`
2. **Tests Automatizados**: Crear tests E2E
3. **Monitoreo**: Agregar métricas y analytics
4. **Optimización**: Implementar caché si es necesario

## Recursos

- Documentación completa: `src/evaluations/STREAMING_TOKENS.md`
- Ejemplos de integración: `src/evaluations/STREAMING_INTEGRATION_EXAMPLE.md`
- Resumen de implementación: `STREAMING_TOKENS_IMPLEMENTATION.md`

## Soporte

Si encuentras problemas:
1. Revisar los logs del servidor
2. Verificar variables de entorno en `.env`
3. Comprobar que la base de datos está actualizada
4. Consultar la documentación completa

¡Listo para usar! 🚀
