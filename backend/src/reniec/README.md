# Módulo de Validación RENIEC

Este módulo proporciona integración con servicios de consulta RENIEC (Registro Nacional de Identificación y Estado Civil) para validar la identidad de personas peruanas mediante su DNI.

## Características

- **Consulta de datos por DNI**: Obtiene información oficial de RENIEC para un DNI dado
- **Validación de nombres**: Compara los nombres ingresados con los datos oficiales de RENIEC
- **Puntuación de coincidencia**: Calcula un score de similitud (0-100) usando algoritmo de Levenshtein
- **Sistema de caché**: Almacena resultados por 24 horas para reducir llamadas a la API
- **Configuración flexible**: Servicio opcional y configurable
- **Manejo de errores robusto**: No bloquea el flujo si RENIEC no está disponible
- **Auditoría completa**: Logs detallados de todas las validaciones

## Configuración

### Variables de entorno

Agregar al archivo `.env`:

```env
# API URL del proveedor de RENIEC (APIs Perú, Nubefact, etc.)
RENIEC_API_URL=https://api.apis.net.pe/v2

# Token de autenticación para la API de RENIEC
RENIEC_API_TOKEN=tu_token_aqui

# Habilitar validación RENIEC (true/false)
RENIEC_VALIDATION_ENABLED=true

# Puntuación mínima de coincidencia para considerar válidos los datos (0-100)
RENIEC_MIN_MATCH_SCORE=80

# Habilitar caché de consultas RENIEC
RENIEC_CACHE_ENABLED=true

# Tiempo de vida del caché en milisegundos (por defecto 24 horas = 86400000)
RENIEC_CACHE_TTL=86400000
```

### Proveedores de API RENIEC recomendados

RENIEC no tiene API pública, por lo que se requiere un servicio intermedio:

1. **APIs Perú** (https://apis.net.pe)
   - Endpoint: `https://api.apis.net.pe/v2/reniec/dni`
   - Parámetro: `numero=12345678`
   - Header: `Authorization: Bearer {token}`

2. **Nubefact** (https://nubefact.com)
   - Endpoint: `https://api.nubefact.com/v1/reniec/dni`

3. **API Perú** (https://apiperu.dev)
   - Endpoint: `https://apiperu.dev/api/dni/{numero}`

**Importante**: La implementación actual está adaptada para APIs Perú. Si usas otro proveedor, deberás ajustar el método `mapResponse()` en `ReniecService`.

## Uso

### 1. Consultar datos de RENIEC

```typescript
// En un servicio
constructor(private readonly reniecService: ReniecService) {}

async consultarDni(dni: string) {
  const data = await this.reniecService.queryByDni(dni);

  if (data) {
    console.log(`Nombre: ${data.nombreCompleto}`);
    console.log(`DNI: ${data.dni}`);
  }
}
```

### 2. Validar datos de una persona

```typescript
async validarPersona(dni: string, firstName: string, lastName: string) {
  const result = await this.reniecService.validatePerson(dni, firstName, lastName);

  console.log(`Válido: ${result.isValid}`);
  console.log(`Score: ${result.matchScore}%`);

  if (!result.isValid) {
    console.log(`Razón: ${result.errorMessage}`);
  }
}
```

### 3. Crear persona con validación RENIEC

```typescript
// En PersonsService
const person = await this.personsService.createWithReniecValidation({
  firstName: 'Juan',
  lastName: 'Pérez García',
  documentType: DocumentType.DNI,
  documentNumber: '12345678',
  email: 'juan@example.com',
});

if (person.flagDataObserved) {
  console.log('Datos requieren revisión');
  console.log(`Score de validación: ${person.reniecValidationScore}%`);
}
```

## Endpoints REST

### GET /api/reniec/query/:dni

Consulta datos de una persona por DNI.

**Permisos**: `ORG_ADMIN`, `SUPER_ADMIN`, `ORG_STAFF_ACCESO`

**Respuesta exitosa**:
```json
{
  "found": true,
  "dni": "12345678",
  "data": {
    "dni": "12345678",
    "nombres": "JUAN CARLOS",
    "apellidoPaterno": "PEREZ",
    "apellidoMaterno": "GARCIA",
    "nombreCompleto": "JUAN CARLOS PEREZ GARCIA",
    "fechaNacimiento": "1990-01-15",
    "sexo": "M"
  }
}
```

### POST /api/reniec/validate

Valida si los datos ingresados coinciden con RENIEC.

**Permisos**: `ORG_ADMIN`, `SUPER_ADMIN`, `ORG_STAFF_ACCESO`

**Body**:
```json
{
  "dni": "12345678",
  "firstName": "Juan Carlos",
  "lastName": "Pérez García"
}
```

**Respuesta**:
```json
{
  "isValid": true,
  "matchScore": 95,
  "message": "Los datos coinciden muy bien con RENIEC",
  "person": {
    "dni": "12345678",
    "nombres": "JUAN CARLOS",
    "apellidoPaterno": "PEREZ",
    "apellidoMaterno": "GARCIA",
    "nombreCompleto": "JUAN CARLOS PEREZ GARCIA"
  },
  "comparisonDetails": {
    "firstNameMatch": 100,
    "lastNameMatch": 92,
    "inputFirstName": "juan carlos",
    "inputLastName": "perez garcia",
    "reniecFirstName": "juan carlos",
    "reniecLastName": "perez garcia"
  }
}
```

### GET /api/reniec/service-info

Obtiene información del servicio RENIEC.

**Permisos**: `SUPER_ADMIN`

**Respuesta**:
```json
{
  "enabled": true,
  "apiUrl": "https://api.apis.net.pe/v2",
  "hasToken": true,
  "minMatchScore": 80,
  "cacheEnabled": true,
  "cacheTtl": 86400000
}
```

### DELETE /api/reniec/cache/:dni

Limpia el caché para un DNI específico.

**Permisos**: `SUPER_ADMIN`

## Algoritmo de validación

### 1. Normalización de strings

Antes de comparar, los nombres se normalizan:
- Conversión a minúsculas
- Eliminación de tildes y diacríticos
- Eliminación de espacios múltiples
- Eliminación de caracteres especiales

Ejemplo:
```
"Juan José Pérez-García" → "juan jose perez garcia"
```

### 2. Cálculo de similitud

Se usa el algoritmo de **distancia de Levenshtein** para calcular cuántas operaciones (inserción, eliminación, sustitución) se necesitan para transformar un string en otro.

```
similarity = (1 - distancia / longitudMáxima) * 100
```

### 3. Puntuación final

```
score = (firstNameMatch * 0.4) + (lastNameMatch * 0.6)
```

Los apellidos tienen más peso (60%) que los nombres (40%) para la validación.

### 4. Umbrales de validación

- **≥ 95%**: Coincidencia perfecta
- **90-94%**: Coincidencia muy buena
- **80-89%**: Coincidencia aceptable (válido)
- **70-79%**: Similar pero bajo umbral (requiere revisión)
- **50-69%**: Diferencias significativas (requiere revisión)
- **< 50%**: No coincide (requiere verificación manual)

## Comportamiento según configuración

### RENIEC_VALIDATION_ENABLED=false

- No se realizan consultas a RENIEC
- `validatePerson()` retorna `isValid: true` con `matchScore: 0`
- No se bloquea la creación de personas
- No se marca `flagDataObserved`

### RENIEC_VALIDATION_ENABLED=true pero sin token

- Se loguea un error en el inicio
- Las consultas retornan `null`
- Se marca `flagDataObserved = true` por seguridad
- No se bloquea la creación de personas

### RENIEC_VALIDATION_ENABLED=true con token válido

- Se realizan consultas normales a RENIEC
- Se marca `flagDataObserved = true` si el score < 80%
- Se guardan `reniecValidationScore` y `reniecValidatedAt`
- No se bloquea la creación incluso si la validación falla

## Sistema de caché

El módulo utiliza un sistema de caché para reducir llamadas a la API de RENIEC:

- **Clave de caché**: `reniec:dni:{numeroDocumento}`
- **TTL por defecto**: 24 horas (86400000 ms)
- **Configurable**: Via `RENIEC_CACHE_TTL`
- **Implementación**: `@nestjs/cache-manager`

### Limpiar caché

```typescript
// Limpiar caché de un DNI específico
await this.reniecService.clearCache('12345678');

// Limpiar todo el caché (desde el controller)
DELETE /api/reniec/cache/12345678
```

## Manejo de errores

El módulo está diseñado para **nunca bloquear el flujo principal**:

1. **Si RENIEC no responde**: Se marca `flagDataObserved = true` y se continúa
2. **Si el DNI no existe en RENIEC**: Se marca para revisión y se continúa
3. **Si hay timeout**: Se loguea el error y se continúa
4. **Si el score es bajo**: Se marca para revisión pero NO se rechaza

### Logs de auditoría

```typescript
// Log de validación exitosa (INFO)
"Persona {id} validada exitosamente con RENIEC. Score: 95%"

// Log de validación fallida (WARN)
"Datos de persona {id} no coinciden con RENIEC. Score: 65%. DNI: 12345678"

// Log de error (ERROR)
"Error validando persona {id} con RENIEC: {mensaje}"
```

## Campos agregados a Person entity

```typescript
@Column({ type: 'int', nullable: true })
reniecValidationScore: number | null;

@Column({ type: 'timestamptz', nullable: true })
reniecValidatedAt: Date | null;
```

## Migración de base de datos

Para aplicar los cambios a la base de datos:

```bash
npm run migration:run
```

La migración `AddReniecValidationToPersons` agrega:
- Columnas `reniecValidationScore` y `reniecValidatedAt`
- Índice para `flagDataObserved`
- Índice para `reniecValidatedAt`

## Consideraciones de seguridad

1. **No loguear datos completos de RENIEC** - Solo información necesaria para auditoría
2. **Usar HTTPS** - Todas las llamadas a la API deben ser seguras
3. **Rate limiting** - Implementar límites para evitar exceder cuotas
4. **Caché sensible** - Los datos en caché son información personal
5. **Permisos restrictivos** - Solo roles autorizados pueden consultar RENIEC

## Costos y límites

Consulta con tu proveedor de API RENIEC:

- **APIs Perú**: ~0.10 USD por consulta, límite de ~100-500 req/min
- **Nubefact**: Planes desde 50 USD/mes
- **API Perú**: Planes desde 29 USD/mes

El sistema de caché ayuda a reducir costos al almacenar resultados por 24 horas.

## Testing

### Modo de desarrollo sin API real

Si no tienes token de RENIEC pero quieres testear el flujo:

```env
RENIEC_VALIDATION_ENABLED=false
```

El sistema funcionará normalmente pero sin validación real.

### Mock para pruebas

```typescript
// En tus tests
const mockReniecService = {
  validatePerson: jest.fn().mockResolvedValue({
    isValid: true,
    matchScore: 95,
    person: {
      dni: '12345678',
      nombres: 'JUAN',
      apellidoPaterno: 'PEREZ',
      apellidoMaterno: 'GARCIA',
      nombreCompleto: 'JUAN PEREZ GARCIA',
    },
  }),
};
```

## Troubleshooting

### "RENIEC validation is DISABLED by configuration"

- Verifica que `RENIEC_VALIDATION_ENABLED=true` en tu `.env`

### "RENIEC API token is not configured"

- Agrega `RENIEC_API_TOKEN` con tu token válido en el `.env`

### "Error querying RENIEC: timeout of 5000ms exceeded"

- La API de RENIEC está lenta o no responde
- El sistema marcará `flagDataObserved` y continuará

### Score muy bajo para nombres válidos

- Verifica que los nombres estén escritos correctamente
- Recuerda que RENIEC usa MAYÚSCULAS sin tildes generalmente
- Ajusta `RENIEC_MIN_MATCH_SCORE` si es necesario (por defecto 80)

## Roadmap

- [ ] Soporte para múltiples proveedores de API
- [ ] Dashboard de estadísticas de validación
- [ ] Validación batch (múltiples DNIs)
- [ ] Webhook para notificar datos observados
- [ ] Exportar personas con `flagDataObserved` para revisión

## Referencias

- [APIs Perú](https://apis.net.pe/reniec-api.html)
- [Algoritmo de Levenshtein](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [RENIEC oficial](https://www.reniec.gob.pe/)
