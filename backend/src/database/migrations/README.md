# Guía de Migraciones de TypeORM

Este directorio contiene todas las migraciones de la base de datos para el proyecto CIP Eventos.

## Configuración

Las migraciones están configuradas en `/src/database/data-source.ts` con las siguientes características:

- **Entorno de Desarrollo**: `DB_SYNC=true` - TypeORM sincroniza automáticamente los cambios de entidades
- **Entorno de Producción**: `DB_SYNC=false` - Las migraciones deben ejecutarse manualmente
- **Auto-run en Producción**: `migrationsRun=true` cuando `NODE_ENV=production`
- **Tabla de historial**: `migrations_history` - Rastrea qué migraciones se han ejecutado

## Scripts Disponibles

### 1. Ver el estado de las migraciones

```bash
npm run migration:show
```

Muestra todas las migraciones y su estado:
- `[ ]` - Migración pendiente (no ejecutada)
- `[X]` - Migración ejecutada

### 2. Generar una nueva migración

```bash
npm run migration:generate -- -n NombreDeLaMigracion
```

**Ejemplo:**
```bash
npm run migration:generate -- -n AddEmailToUser
```

Este comando:
- Compara tus entidades actuales con el esquema de la base de datos
- Genera automáticamente una migración con los cambios necesarios
- Guarda el archivo en `src/database/migrations/`

### 3. Crear una migración vacía

```bash
npm run migration:create -- -n NombreDeLaMigracion
```

**Ejemplo:**
```bash
npm run migration:create -- -n AddCustomIndex
```

Útil cuando necesitas escribir SQL personalizado o lógica compleja que TypeORM no puede generar automáticamente.

### 4. Ejecutar migraciones pendientes

```bash
npm run migration:run
```

Ejecuta todas las migraciones pendientes en orden cronológico. Este comando:
- Lee las migraciones en `src/database/migrations/`
- Compara con las registradas en la tabla `migrations_history`
- Ejecuta solo las que no se han aplicado

### 5. Revertir la última migración

```bash
npm run migration:revert
```

Deshace la última migración ejecutada. Puedes ejecutarlo múltiples veces para revertir varias migraciones.

## Flujo de Trabajo Recomendado

### Desarrollo Local

1. Realiza cambios en tus entidades (archivos `*.entity.ts`)
2. Genera una migración:
   ```bash
   npm run migration:generate -- -n DescripcionDelCambio
   ```
3. Revisa el archivo de migración generado
4. Si `DB_SYNC=true`, tus cambios ya están en la DB local
5. Si `DB_SYNC=false`, ejecuta la migración:
   ```bash
   npm run migration:run
   ```

### Preparación para Producción

Antes de hacer deploy:

1. Asegúrate de que todas las migraciones estén commiteadas en git
2. Verifica que las migraciones se ejecuten correctamente en un entorno de staging:
   ```bash
   npm run migration:run
   ```
3. Si hay problemas, revierte:
   ```bash
   npm run migration:revert
   ```
4. Corrige la migración y vuelve a intentar

### Deploy en Producción

**Opción 1: Auto-run (Recomendado)**

Con `NODE_ENV=production` y `migrationsRun=true`, las migraciones se ejecutan automáticamente al iniciar la aplicación.

**Opción 2: Manual**

Ejecuta las migraciones antes de iniciar la aplicación:

```bash
NODE_ENV=production npm run migration:run
npm run start:prod
```

## Buenas Prácticas

1. **Nombres descriptivos**: Usa nombres claros que describan el cambio
   - Bueno: `AddPhoneNumberToUser`, `CreateOrdersTable`
   - Malo: `Migration1`, `Update`, `Fix`

2. **Una responsabilidad**: Cada migración debe hacer una cosa específica
   - No mezcles múltiples cambios no relacionados en una migración

3. **Reversible**: Siempre implementa el método `down()` correctamente
   - Prueba que `migration:revert` funcione antes de hacer commit

4. **Revisa el SQL generado**: TypeORM genera el SQL automáticamente
   - Revisa siempre el archivo generado antes de ejecutarlo
   - Asegúrate de que el SQL es eficiente y correcto

5. **No modifiques migraciones ejecutadas**:
   - Una vez que una migración se ejecuta en producción, no la modifiques
   - Crea una nueva migración para correcciones

6. **Datos sensibles**: Ten cuidado con migraciones que manipulan datos
   - Haz backups antes de ejecutar migraciones de datos en producción
   - Considera usar transacciones explícitas

7. **Testing**: Prueba las migraciones en un entorno similar a producción
   - Usa datos de prueba realistas
   - Verifica que la reversión funcione

## Variables de Entorno Importantes

```env
# Desarrollo: true permite auto-sync de entidades
# Producción: false requiere migraciones explícitas
DB_SYNC=false

# Entorno de ejecución
NODE_ENV=production
```

## Solución de Problemas

### Error: "Cannot find module"

Asegúrate de que `ts-node` y `tsconfig-paths` están instalados:

```bash
npm install --save-dev ts-node tsconfig-paths
```

### Migración no se detecta

Verifica que el archivo esté en `src/database/migrations/` y tenga el formato correcto:
- Nombre: `{timestamp}-{NombreDescriptivo}.ts`
- Exporte una clase con métodos `up()` y `down()`

### Error en producción con archivos .ts

Asegúrate de que el path de migrations incluya archivos `.js` compilados:

```typescript
migrations: [join(__dirname, 'migrations', '*.{ts,js}')]
```

### Migración parcialmente ejecutada

Si una migración falla a mitad de camino:

1. Revierte manualmente los cambios en la base de datos
2. Elimina el registro de la tabla `migrations_history`
3. Corrige la migración
4. Vuelve a ejecutar

## Recursos Adicionales

- [Documentación oficial de TypeORM Migrations](https://typeorm.io/migrations)
- [Guía de mejores prácticas de migraciones](https://typeorm.io/migrations#creating-a-new-migration)
