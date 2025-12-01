# Integracion de Componentes RUI Layout en CIP Eventos

## Resumen

Se ha integrado exitosamente el nuevo sistema de layout basado en Refactoring UI (`AppLayout`) con el proyecto CIP Eventos, preservando toda la logica existente de autenticacion, routing, i18n y React Query.

## Archivos Creados

### 1. `/src/components/dashboard/RuiDashboardApp.tsx`

Nuevo componente principal que reemplaza `DashboardApp.tsx` utilizando el nuevo `AppLayout` de Refactoring UI.

**Caracteristicas preservadas:**
- Autenticacion mediante `useAuthStore`
- Redireccion a login si no hay token
- Manejo de hidratacion del store persistente
- Sistema de rutas (routing) completo en ES e EN
- Integracion de React Query (`QueryClientProvider`)
- Sistema de i18n (`useTranslation`)
- Renderizado de vistas segun ruta activa
- Manejo de breadcrumbs
- Gestion de eventos (crear, editar, listar, gestionar)

**Nuevas caracteristicas:**
- Usa `AppLayout` de `@/components/layout`
- Interfaz de usuario renovada con componentes RUI
- Sidebar oscuro con iconos duotone
- Header con busqueda y notificaciones
- Navegacion mejorada con estados visuales

## Archivos Modificados

### Paginas Astro Actualizadas

Todas las siguientes paginas han sido actualizadas para usar `RuiDashboardApp` en lugar de `DashboardApp`:

**Espanol:**
- `/src/pages/index.astro` - Dashboard principal
- `/src/pages/eventos/index.astro` - Lista de eventos
- `/src/pages/eventos/nuevo.astro` - Crear evento
- `/src/pages/eventos/[id].astro` - Gestion de evento

**Ingles:**
- `/src/pages/en/index.astro` - Dashboard principal
- `/src/pages/en/events/index.astro` - Events list
- `/src/pages/en/events/new.astro` - Create event
- `/src/pages/en/events/[id].astro` - Event management

## Mapeo de Navegacion

El componente `RuiDashboardApp` implementa un sistema de mapeo bidireccional entre rutas URL y IDs de navegacion del sidebar:

### NavId a Ruta (ES/EN)

```typescript
dashboard -> / | /en
eventos -> /eventos | /en/events
ponentes -> /ponentes | /en/speakers
organizadores -> /organizadores | /en/organizers
inscripciones -> /inscripciones | /en/registrations
control-acceso -> /control-acceso | /en/access-control
certificados -> /certificados | /en/certificates
ingresos -> /ingresos | /en/revenue
pagos -> /pagos | /en/payments
reportes -> /reportes | /en/reports
usuarios -> /usuarios | /en/users
padron-cip -> /padron-cip | /en/cip-registry
configuracion -> /configuracion | /en/settings
```

## Datos de Usuario para Layout

El componente transforma los datos del usuario del store de autenticacion al formato requerido por `AppLayout`:

```typescript
{
  name: `${user.firstName} ${user.lastName}` || user.email,
  role: "Superadministrador" | "Administrador" | "Usuario",
  avatar: user.avatar
}
```

## Funcionalidades del Nuevo Layout

### AppLayout
- Sidebar fijo en desktop, overlay en mobile
- Header con busqueda global
- Notificaciones (contador de no leidas)
- Perfil de usuario con dropdown
- Cerrar sesion

### Sidebar
- Navegacion organizada por secciones
- Iconos duotone personalizados
- Estados activos/hover/focus
- Logo y branding del CIP
- Informacion del usuario al pie

### Header
- Boton de menu para mobile
- Barra de busqueda
- Icono de notificaciones con badge
- Avatar del usuario
- Dropdown con opciones

## Renderizado de Contenido

El componente mantiene la misma logica de renderizado que `DashboardApp`:

1. **Dashboard** (`/`, `/en`) -> `DashboardContent`
2. **Crear Evento** -> `CreateEventView`
3. **Editar Evento** (con ID de ruta) -> `EditEventView`
4. **Gestionar Evento** (con ID de ruta) -> `EventManagementView`
5. **Lista de Eventos** -> `EventsView`
6. **Otras secciones** -> `SectionPlaceholder`

## Compatibilidad

### Archivos Antiguos Preservados

Los siguientes archivos **NO** han sido eliminados y pueden coexistir:
- `DashboardApp.tsx` - Componente original
- `DashboardLayout.tsx` - Layout original
- `Sidebar.tsx` - Sidebar original
- `DashboardHeader.tsx` - Header original
- `button.tsx` - Componente UI original (restaurado desde f3f2989)
- `input.tsx` - Componente UI original (restaurado desde f3f2989)

**IMPORTANTE**: Los componentes UI antiguos fueron restaurados porque el codigo antiguo
(`DashboardApp`, `Sidebar`, etc.) los necesita. Ahora coexisten con sus versiones RUI:
- `button.tsx` (antiguo) + `rui-button.tsx` (nuevo)
- `input.tsx` (antiguo) + `rui-input.tsx` (nuevo)

Esto permite una migracion gradual y rollback en caso de problemas.

### Type Imports

El tipo `Breadcrumb` sigue exportandose desde `DashboardApp.tsx` y es usado por:
- `RuiDashboardApp.tsx`
- `EditEventView.tsx`

## Navegacion

### Navegacion del Sidebar
```typescript
onNavChange(navId: string) -> getPathFromNavId() -> handleNavigate()
```

### Navegacion desde Componentes Hijos
```typescript
onNavigate(href: string) -> handleNavigate() -> history.pushState()
```

### Deteccion de Ruta Activa
```typescript
window.location.pathname -> getNavIdFromPath() -> activeNav
```

## Testing

Para verificar que la integracion funciona correctamente:

1. **Autenticacion**: Visitar `/` sin estar logueado debe redirigir a `/iniciar-sesion`
2. **Navegacion**: Hacer clic en items del sidebar debe cambiar la vista
3. **URLs directas**: Navegar a `/eventos` debe mostrar la lista de eventos
4. **i18n**: Cambiar entre `/` y `/en` debe mantener la funcionalidad
5. **Eventos**: Crear, editar y gestionar eventos debe funcionar igual
6. **Mobile**: El sidebar debe convertirse en overlay en pantallas pequenas
7. **Logout**: Cerrar sesion debe redirigir al login

## Notas Importantes

1. La funcionalidad de busqueda en el header esta implementada pero aun no conectada
2. El contador de notificaciones esta hardcodeado a 3 en `AppLayout`
3. Los placeholders para secciones sin implementar siguen presentes
4. El sistema de breadcrumbs del header original no esta integrado en el nuevo layout

## Build y Deployment

### Estado del Build

El proyecto compila correctamente con el siguiente comando:
```bash
npm run build
```

### Warnings

1. **Chunk Size Warning**: El archivo `RuiDashboardApp.js` es ~572 KB despues de minificacion.
   - Esto es aceptable para un SPA pero podria optimizarse con code-splitting
   - Considerar usar dynamic imports para componentes grandes

2. **Prerender Warning**: Algunas paginas intentan acceder a `Astro.request.headers` en prerender.
   - Afecta a `/eventos/index.astro` y `/eventos/nuevo.astro`
   - Se puede ignorar o cambiar a `export const prerender = false`

### Archivos Generados

El build genera los siguientes archivos principales:
- `RuiDashboardApp.CGXSukPB.js` - 572.14 kB (161.14 kB gzip)
- `client.DfL0IJtW.js` - 182.74 kB (57.51 kB gzip)
- `Layout.astro_astro_type_script_index_0_lang.B6bk46_K.js` - 73.02 kB (23.61 kB gzip)
- `rui-input.BvlHo_jb.js` - 52.35 kB (20.43 kB gzip)

## Proximos Pasos

1. Implementar funcionalidad de busqueda global
2. Conectar contador de notificaciones real
3. Integrar breadcrumbs en el nuevo header
4. Agregar rutas para ingresos, pagos y reportes
5. Optimizar bundle size con code-splitting si es necesario
6. Considerar eliminar componentes antiguos una vez verificada la estabilidad
