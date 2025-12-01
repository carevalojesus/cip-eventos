# Componentes de Layout - CIP Eventos

Este directorio contiene todos los componentes de layout para el sistema CIP Eventos, siguiendo el diseño del dashboard-app de Refactoring UI.

## Componentes Creados

### 1. `rui-sidebar-item.tsx`
Componente individual para los items del menú lateral.

**Props:**
- `icon`: Componente de ícono duotono
- `label`: Texto del item
- `isActive?`: Estado activo del item
- `onClick?`: Callback al hacer click
- `badge?`: Badge de notificación (string | number)
- `href?`: URL para navegación (opcional)

**Características:**
- Estados hover con colores específicos
- Indicador amarillo izquierdo cuando está activo
- Soporte para badges de notificación
- Colores de íconos dinámicos según estado

### 2. `rui-sidebar-section.tsx`
Componente para agrupar items del sidebar en secciones.

**Props:**
- `title?`: Título opcional de la sección
- `children`: Items de la sección

**Características:**
- Título en uppercase con letra pequeña
- Espaciado consistente entre items
- Separación visual entre secciones

### 3. `rui-sidebar.tsx`
Sidebar principal con navegación completa del sistema.

**Props:**
- `user`: Objeto con nombre, rol y avatar del usuario
- `activeNav`: ID del item activo
- `onNavChange`: Callback al cambiar de navegación
- `onLogout?`: Callback al cerrar sesión
- `isOpen?`: Estado de apertura (para móvil)
- `onClose?`: Callback para cerrar (móvil)

**Estructura del Menú:**
1. **GENERAL**
   - Dashboard

2. **GESTIÓN DE EVENTOS**
   - Mis Eventos
   - Ponentes
   - Organizadores

3. **OPERACIONES**
   - Inscripciones
   - Control de Acceso
   - Certificados

4. **FINANZAS**
   - Ingresos
   - Pagos
   - Reportes

5. **ADMINISTRACIÓN**
   - Usuarios
   - Padrón CIP
   - Configuración

**Características:**
- Logo CIP Eventos en la parte superior
- Perfil de usuario en la parte inferior con botón de logout
- Responsive: se convierte en overlay en móvil (< 768px)
- Traducciones con react-i18next
- Avatar con iniciales si no hay imagen

### 4. `rui-header.tsx`
Header fijo con búsqueda y acciones.

**Props:**
- `user`: Objeto con nombre y avatar
- `searchQuery`: Query de búsqueda actual
- `onSearchChange`: Callback al cambiar búsqueda
- `onMenuToggle?`: Callback para abrir menú móvil
- `notificationCount?`: Número de notificaciones

**Características:**
- Barra de búsqueda integrada
- Botón "Nuevo Evento"
- Notificaciones con badge
- Menú de usuario
- Botón hamburguesa en móvil
- Responsive: se adapta a pantallas pequeñas

### 5. `rui-app-layout.tsx`
Layout principal que integra Sidebar, Header y contenido.

**Props:**
- `children`: Contenido de la página
- `user`: Datos del usuario
- `activeNav`: Navegación activa
- `onNavChange`: Callback de navegación
- `searchQuery?`: Query de búsqueda
- `onSearchChange?`: Callback de búsqueda
- `onLogout?`: Callback de logout

**Características:**
- Gestión automática del estado del sidebar en móvil
- Responsive: ajusta márgenes según viewport
- Cierre automático del sidebar al navegar en móvil
- Fondo gris claro (#FAF9F7)

### 6. `index.ts`
Barrel exports para importaciones limpias.

## Uso

```tsx
import { AppLayout } from '@/components/layout'

function Dashboard() {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')

  const user = {
    name: 'Juan Pérez',
    role: 'Administrador',
    avatar: '/path/to/avatar.jpg' // opcional
  }

  return (
    <AppLayout
      user={user}
      activeNav={activeNav}
      onNavChange={setActiveNav}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onLogout={() => console.log('Logout')}
    >
      {/* Tu contenido aquí */}
      <h1>Dashboard</h1>
    </AppLayout>
  )
}
```

## Paleta de Colores

### Sidebar
- Fondo: `#27241D` (grey[900])
- Borde: `#3A3730` (grey[800])
- Texto inactivo: `#B8B2A7` (grey[300])
- Texto hover: `#E8E6E1` (grey[100])
- Texto activo: `#FAF9F7` (grey[50])
- Item hover/activo: `#423D33` (grey[800])
- Indicador activo: `#F0B429` (yellow[500])
- Badge: `#BA2525` (red[500])

### Header
- Fondo: `#FFFFFF` (white)
- Borde: `#E8E6E1` (grey[100])
- Input fondo: `#F5F4F2` (grey[50])

### Main
- Fondo: `#FAF9F7` (grey[50])

## Dimensiones

- **Sidebar width**: `260px`
- **Header height**: `64px`
- **Mobile breakpoint**: `768px`

## Dependencias

- `react-i18next`: Para traducciones
- `@/components/icons/DuotoneIcons`: Iconos duotonos
- `@/components/ui/rui-button`: Botón de la UI
- `@/components/ui/rui-input`: Input de búsqueda

## Notas

- Todos los componentes usan inline styles (NO Tailwind)
- Compatible con Astro y React
- Soporte completo para móvil con overlay
- Íconos duotonos con colores dinámicos según estado
- Traducciones integradas con i18n
