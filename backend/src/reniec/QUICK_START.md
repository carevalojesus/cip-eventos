# RENIEC Integration - Quick Start Guide

## ¿Qué hace este módulo?

Valida automáticamente los datos de DNI de personas peruanas contra el registro oficial de RENIEC, marcando aquellos que no coinciden para revisión manual del organizador.

## Instalación Rápida (5 minutos)

### Paso 1: Ejecutar migración de base de datos

```bash
npm run migration:run
```

Esto agrega los campos `reniecValidationScore` y `reniecValidatedAt` a la tabla `persons`.

### Paso 2: Configurar variables de entorno

Agregar al archivo `.env`:

```env
# RENIEC Validation (Optional)
RENIEC_VALIDATION_ENABLED=false  # Cambiar a 'true' cuando tengas el token
RENIEC_API_URL=https://api.apis.net.pe/v2
RENIEC_API_TOKEN=                # Tu token aquí
RENIEC_MIN_MATCH_SCORE=80
RENIEC_CACHE_ENABLED=true
RENIEC_CACHE_TTL=86400000
```

### Paso 3: Obtener token de API RENIEC

**Opción recomendada: APIs Perú**

1. Ir a https://apis.net.pe/registro
2. Crear cuenta y suscribirse al plan RENIEC
3. Copiar tu API token
4. Pegar en `RENIEC_API_TOKEN` en tu `.env`
5. Cambiar `RENIEC_VALIDATION_ENABLED=true`

**Costo aproximado**: $0.10 USD por consulta (el caché reduce esto significativamente)

### Paso 4: Reiniciar la aplicación

```bash
npm run start:dev
```

## Uso Básico

### En desarrollo (sin token)

Dejar `RENIEC_VALIDATION_ENABLED=false`. El sistema funcionará normalmente pero sin validación real.

### En producción (con token)

El módulo ya está integrado con `PersonsService`. Solo necesitas usar el método correcto:

```typescript
// Antes (sin validación)
const person = await this.personsService.create(dto);

// Ahora (con validación RENIEC)
const person = await this.personsService.createWithReniecValidation(dto);
```

## ¿Cómo saber si una persona requiere revisión?

```typescript
if (person.flagDataObserved) {
  console.log(`⚠️ Requiere revisión manual`);
  console.log(`Score: ${person.reniecValidationScore}%`);
  console.log(`Validado: ${person.reniecValidatedAt}`);
}
```

## Endpoints disponibles

Una vez que la app esté corriendo, puedes probar:

### 1. Consultar DNI en RENIEC

```bash
GET /api/reniec/query/12345678
Authorization: Bearer {tu_token_jwt}
```

### 2. Validar datos de una persona

```bash
POST /api/reniec/validate
Authorization: Bearer {tu_token_jwt}
Content-Type: application/json

{
  "dni": "12345678",
  "firstName": "Juan",
  "lastName": "Pérez García"
}
```

**Roles requeridos**: `ORG_ADMIN`, `SUPER_ADMIN`, o `ORG_STAFF_ACCESO`

## Dashboard del Organizador (Próximo paso)

Para que el organizador pueda revisar personas marcadas, implementar:

```typescript
// En un nuevo endpoint
@Get('persons/requiring-review')
async getPersonsRequiringReview() {
  const persons = await this.personRepository.find({
    where: { flagDataObserved: true },
    order: { reniecValidationScore: 'ASC' }, // Peores primero
  });

  return persons.map(p => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    dni: p.documentNumber,
    score: p.reniecValidationScore,
    status: p.reniecValidationScore < 50 ? 'CRÍTICO' : 'REVISAR'
  }));
}
```

## Troubleshooting

### ❌ "RENIEC validation is DISABLED"

**Solución**: Cambiar `RENIEC_VALIDATION_ENABLED=true` en `.env`

### ❌ "RENIEC API token is not configured"

**Solución**: Agregar tu token en `RENIEC_API_TOKEN` en `.env`

### ❌ Error 401/403 al consultar RENIEC

**Solución**: Verificar que tu token sea válido y tenga créditos

### ❌ Score muy bajo para datos correctos

**Posibles causas**:
- Nombres con tildes vs sin tildes (ej: "José" vs "Jose")
- Orden de apellidos diferente
- Nombres compuestos incompletos

**Solución**: Ajustar `RENIEC_MIN_MATCH_SCORE` a un valor más bajo (ej: 70)

## Flujo Completo del Usuario

```
1. Usuario ingresa datos en formulario de registro
   ↓
2. Backend crea persona con createWithReniecValidation()
   ↓
3. RENIEC valida automáticamente (si habilitado)
   ↓
4. Si score < 80%:
   - flagDataObserved = true
   - Organizador recibe notificación (opcional)
   - Usuario ve mensaje: "Tu registro está en revisión"
   ↓
5. Organizador revisa en dashboard
   ↓
6. Organizador aprueba o rechaza manualmente
```

## Características Importantes

✅ **No bloquea el registro**: Aunque los datos no coincidan, el usuario se registra
✅ **Caché inteligente**: Consultas repetidas se sirven desde caché (24h)
✅ **Graceful degradation**: Si RENIEC falla, el sistema continúa
✅ **Auditoría completa**: Todos los logs guardados para revisión
✅ **Configurable**: Puede activarse/desactivarse sin cambios de código

## Costos Estimados

Con caché habilitado:

- **Evento pequeño** (100 personas): ~$5 USD
- **Evento mediano** (500 personas): ~$20 USD
- **Evento grande** (2000 personas): ~$60 USD

El caché reduce significativamente los costos en eventos con múltiples sesiones donde personas se re-registran.

## Métricas a Monitorear

1. **Tasa de validación**: % de personas validadas con RENIEC
2. **Score promedio**: Qué tan bien coinciden los datos en general
3. **Tasa de revisión**: % de personas que requieren revisión manual
4. **Uso de caché**: % de consultas servidas desde caché

## Próximos Pasos

1. ✅ Ejecutar migración
2. ✅ Configurar variables de entorno
3. ✅ Obtener token de API RENIEC
4. ⏳ Integrar en flujo de registrations
5. ⏳ Crear dashboard de revisión para organizadores
6. ⏳ Configurar notificaciones cuando hay datos observados
7. ⏳ Agregar estadísticas de validación en dashboard

## Documentación Adicional

- **Documentación completa**: [README.md](./README.md)
- **Ejemplos de integración**: [INTEGRATION_EXAMPLE.md](./INTEGRATION_EXAMPLE.md)
- **Resumen técnico**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## Soporte

Para ayuda adicional:
1. Revisar logs de la aplicación en modo debug
2. Consultar documentación del proveedor de API RENIEC
3. Verificar que el DNI tenga exactamente 8 dígitos
4. Probar con endpoint `/api/reniec/service-info` (SUPER_ADMIN)

---

**¿Listo para empezar?**

```bash
# 1. Ejecutar migración
npm run migration:run

# 2. Reiniciar app
npm run start:dev

# 3. Probar endpoint
curl -X GET http://localhost:3000/api/reniec/service-info \
  -H "Authorization: Bearer {tu_token}"
```

✅ Si ves `{ "enabled": false, ... }` está todo OK, solo falta configurar el token!
