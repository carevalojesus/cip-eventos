# Análisis Completo del Frontend - CIP Eventos

## 📋 Resumen Ejecutivo

El frontend de **CIP Eventos** es una aplicación web moderna construida con **Astro** y **React**, diseñada para gestionar eventos académicos. Utiliza un enfoque híbrido donde Astro maneja el routing y SSR, mientras que React proporciona interactividad en componentes específicos.

---

## 🏗️ Arquitectura General

### Stack Tecnológico

-   **Framework Base**: Astro 5.16.1 (SSR habilitado)
-   **UI Framework**: React 19.2.1
-   **Estilos**: Tailwind CSS 4.1.17
-   **Estado Global**: Zustand 5.0.8
-   **Data Fetching**: TanStack Query (React Query) 5.90.11
-   **Formularios**: React Hook Form 7.66.1 + Zod 3.24.2
-   **HTTP Client**: Axios 1.13.2
-   **Internacionalización**: i18next 25.6.3 + react-i18next
-   **UI Components**: Radix UI (múltiples componentes)
-   **Notificaciones**: Sonner 2.0.7

### Estructura de Directorios

```
frontend/
├── src/
│   ├── assets/          # Imágenes y recursos estáticos
│   ├── components/      # Componentes React organizados por dominio
│   │   ├── auth/        # Autenticación (Login, Reset Password, etc.)
│   │   ├── dashboard/   # Dashboard principal
│   │   ├── events/      # Gestión de eventos
│   │   ├── layout/      # Layout principal (Sidebar, Header, AppLayout)
│   │   ├── profile/     # Perfil de usuario
│   │   ├── users/       # Gestión de usuarios
│   │   └── ui/          # Componentes UI reutilizables
│   ├── config/          # Configuración (navegación, etc.)
│   ├── constants/       # Constantes (roles, auth, etc.)
│   ├── hooks/           # Custom hooks de React
│   ├── i18n/            # Internacionalización (es/en)
│   ├── layouts/         # Layouts de Astro
│   ├── lib/             # Utilidades y helpers
│   ├── pages/           # Páginas de Astro (routing)
│   ├── services/        # Servicios API
│   ├── store/           # Estado global (Zustand)
│   ├── types/           # TypeScript types
│   └── utils/           # Utilidades generales
├── public/              # Assets públicos
└── astro.config.mjs     # Configuración de Astro
```

---

## 🔐 Autenticación y Seguridad

### Sistema de Autenticación

**Store de Autenticación** (`store/auth.store.ts`):

-   Utiliza **Zustand** con persistencia
-   Soporta **localStorage** y **sessionStorage** según preferencia del usuario (rememberMe)
-   Maneja tokens de acceso y datos del usuario
-   Implementa hidratación para evitar race conditions

**Características clave**:

-   ✅ Refresh token en cookies httpOnly (más seguro)
-   ✅ Access token en memoria/storage
-   ✅ Interceptor de Axios para inyección automática de tokens
-   ✅ Manejo automático de refresh token cuando expira el access token
-   ✅ Logout que limpia cookies y storage

**Flujo de autenticación**:

1. Usuario inicia sesión → recibe access_token
2. Refresh token se guarda en cookie httpOnly (backend)
3. Access token se guarda en storage (frontend)
4. Interceptor añade token a cada request
5. Si token expira (401) → intenta refresh automáticamente
6. Si refresh falla → logout y redirección a login

### Middleware de Protección

**Middleware de Astro** (`middleware.ts`):

-   Protege rutas basándose en cookies (refresh_token)
-   Redirige a login si no hay sesión activa
-   Soporta rutas en español e inglés

---

## 🌐 Internacionalización (i18n)

### Configuración

-   **Idiomas soportados**: Español (default), Inglés
-   **Librería**: i18next + react-i18next
-   **Detección**: localStorage → navigator
-   **Archivos de traducción**: `i18n/locales/es.json`, `i18n/locales/en.json`

### Routing Multilingüe

**Sistema de rutas** (`lib/routes.ts`):

-   Rutas separadas por idioma:
    -   Español: `/iniciar-sesion`, `/eventos`, `/usuarios`
    -   Inglés: `/en/login`, `/en/events`, `/en/users`
-   Función `getCurrentLocale()` detecta idioma desde URL o localStorage
-   Función `switchLocale()` permite cambiar idioma manteniendo la página actual

**Configuración en Astro**:

```javascript
i18n: {
  defaultLocale: 'es',
  locales: ['es', 'en'],
  routing: {
    prefixDefaultLocale: false, // /login para español, /en/login para inglés
  },
}
```

---

## 🎨 Sistema de Diseño y UI

### Componentes UI

**Dos sistemas de componentes**:

1. **Componentes base** (`components/ui/`):

    - Basados en Radix UI
    - Componentes primitivos: Button, Dialog, Select, Tabs, etc.

2. **Componentes RUI** (`components/ui/rui/`):
    - Sistema de diseño personalizado "Refactoring UI"
    - Componentes más específicos: PageHeader, Drawer, DatePicker, etc.
    - Formularios especializados: FormCard, FormSelect, FormDateTimePicker

### Estilos

-   **Tailwind CSS 4.1.17** con configuración personalizada
-   Variables CSS para tokens de diseño (`lib/styleTokens.ts`)
-   Sistema de colores consistente
-   Responsive design con breakpoints móviles

---

## 📊 Gestión de Estado

### Estado Global (Zustand)

**Store de Autenticación**:

-   Token, usuario, estado de autenticación
-   Persistencia en storage
-   Métodos: login, logout, updateToken, updateUser

### Estado del Servidor (React Query)

**Configuración** (`lib/queryClient.ts`):

-   `staleTime`: 5 minutos
-   `refetchOnWindowFocus`: false
-   `retry`: 1 intento

**Hooks personalizados**:

-   `useEvents()` - Lista de eventos
-   `useCreateUser()` - Crear usuario
-   `useDashboard()` - Datos del dashboard
-   `useEventDetails()` - Detalles de evento
-   `useSessions()` - Sesiones
-   `useTickets()` - Tickets
-   Y más...

---

## 🔌 Servicios API

### Cliente HTTP

**Configuración** (`lib/api.ts`):

-   Base URL desde `PUBLIC_API_URL`
-   `withCredentials: true` para cookies
-   Interceptor de request: inyecta token automáticamente
-   Interceptor de response: maneja refresh token y errores 401

### Servicios Disponibles

1. **users.service.ts**: CRUD de usuarios, roles, perfiles, avatares
2. **events.service.ts**: CRUD de eventos, tipos, categorías, modalidades
3. **sessions.service.ts**: Gestión de sesiones
4. **tickets.service.ts**: Gestión de tickets
5. **dashboard.service.ts**: Datos del dashboard
6. **profile.service.ts**: Perfil del usuario actual
7. **audit.service.ts**: Auditoría (nuevo)

---

## 🧭 Navegación y Routing

### Sistema de Navegación

**Configuración** (`config/navigation.ts`):

-   Navegación basada en roles
-   Secciones organizadas por dominio funcional:
    -   General (Dashboard)
    -   Plataforma (Solo SUPER_ADMIN)
    -   Gestión de Eventos
    -   Mis Sesiones (Ponentes)
    -   Mis Eventos (Participantes)
    -   Operaciones (Staff)
    -   Finanzas
    -   Administración

**Roles del Sistema** (`constants/roles.ts`):

-   `SUPER_ADMIN`: Acceso total
-   `ORG_ADMIN`: Administrador de organizador
-   `ORG_STAFF_ACCESO`: Staff de acceso/acreditación
-   `ORG_STAFF_ACADEMICO`: Staff académico
-   `ORG_FINANZAS`: Staff de finanzas
-   `PONENTE`: Ponente
-   `PARTICIPANTE`: Participante

**Funciones de navegación**:

-   `getNavigationForRole()`: Filtra navegación por rol
-   `canAccessNav()`: Verifica acceso a ruta
-   `getDefaultNavForRole()`: Ruta por defecto según rol

### Routing en Astro

**Páginas principales**:

-   `/` o `/en` - Dashboard
-   `/iniciar-sesion` o `/en/login` - Login
-   `/eventos` o `/en/events` - Lista de eventos
-   `/eventos/nuevo` o `/en/events/new` - Crear evento
-   `/eventos/[id]` - Detalle/gestión de evento
-   `/usuarios` o `/en/users` - Gestión de usuarios
-   `/usuarios/nuevo` - Crear usuario

---

## 📝 Formularios

### Sistema de Formularios

**Stack**:

-   React Hook Form para manejo de estado
-   Zod para validación
-   Integración con componentes UI

**Ejemplo** (`hooks/useCreateUser.ts`):

-   Schema de validación con Zod
-   Integración con i18n para mensajes de error
-   Manejo de errores del backend
-   Toast notifications con Sonner

---

## 🎯 Componentes Principales

### Layout

**AppLayout** (`components/layout/rui-app-layout.tsx`):

-   Sidebar con navegación por roles
-   Header con usuario y notificaciones
-   Responsive (mobile/desktop)
-   Integración con i18n

### Dashboard

**RuiDashboardApp** (`components/dashboard/RuiDashboardApp.tsx`):

-   Componente principal que maneja routing interno
-   Integra QueryClientProvider
-   Maneja autenticación y redirecciones
-   Renderiza diferentes vistas según ruta activa

### Gestión de Usuarios

**Componentes**:

-   `UsersView`: Lista de usuarios con filtros y paginación
-   `CreateUserView`: Crear nuevo usuario
-   `UserDetailView`: Detalle de usuario con tabs (Personal, Seguridad, Actividad)
-   `UserTable`: Tabla de usuarios
-   `UserFilters`: Filtros de búsqueda
-   `UserBulkActions`: Acciones masivas

### Gestión de Eventos

**Componentes**:

-   `EventsView`: Lista de eventos
-   `EventManagementView`: Vista de gestión completa
-   `EditEventView`: Edición de evento
-   `CreateEventViewRui`: Crear evento (nuevo diseño)
-   `EventTable`: Tabla de eventos
-   `EventFilters`: Filtros
-   Tabs: General, Sesiones, Tickets

---

## 🔧 Utilidades y Helpers

### Utilidades Disponibles

-   **dateUtils.ts**: Formateo de fechas con date-fns
-   **userUtils.ts**: Utilidades para usuarios
-   **statusConfig.ts**: Configuración de estados
-   **styleTokens.ts**: Tokens de diseño CSS
-   **utils.ts**: Utilidades generales (cn, etc.)
-   **logger.ts**: Sistema de logging

---

## 📱 Responsive Design

### Breakpoints

-   Mobile: < 768px
-   Desktop: >= 768px

**Características**:

-   Sidebar colapsable en mobile
-   Menú hamburguesa en mobile
-   Layout adaptativo

---

## 🚀 Rendimiento

### Optimizaciones

1. **Astro SSR**: Renderizado en servidor para mejor SEO y carga inicial
2. **React Query**: Caché de datos con staleTime configurado
3. **Code Splitting**: Componentes React cargados con `client:only="react"`
4. **Lazy Loading**: Posible con React.lazy (no observado en código actual)

### Posibles Mejoras

-   Implementar React.lazy para componentes grandes
-   Optimización de imágenes (Sharp ya incluido)
-   Service Worker para PWA
-   Virtualización de listas largas

---

## 🐛 Manejo de Errores

### Estrategias

1. **React Query**: Manejo automático de errores en queries
2. **Axios Interceptors**: Manejo centralizado de errores HTTP
3. **Toast Notifications**: Feedback visual con Sonner
4. **Logger**: Sistema de logging para debugging

### Estados de Error

-   Componentes de error: `ErrorState` en dashboard
-   Loading states: `LoadingState`, `Skeleton` components
-   Empty states: `EmptyState` component

---

## 🔍 Testing

**Estado actual**: No se observan tests en el código
**Recomendación**: Implementar tests con Vitest + React Testing Library

---

## 📦 Dependencias Clave

### Producción

-   **Astro**: Framework base
-   **React**: UI framework
-   **Zustand**: Estado global
-   **TanStack Query**: Data fetching
-   **React Hook Form + Zod**: Formularios
-   **Axios**: HTTP client
-   **i18next**: Internacionalización
-   **Radix UI**: Componentes accesibles
-   **Tailwind CSS**: Estilos
-   **Sonner**: Notificaciones

### Desarrollo

-   **tw-animate-css**: Animaciones CSS

---

## 🎨 Patrones de Diseño

### Arquitectura

1. **Separación de responsabilidades**:

    - Services → Lógica de API
    - Hooks → Lógica de negocio
    - Components → Presentación
    - Store → Estado global

2. **Composición de componentes**:

    - Componentes pequeños y reutilizables
    - Componentes compuestos para funcionalidad compleja

3. **Custom Hooks**:
    - Lógica reutilizable extraída a hooks
    - Separación de concerns

---

## ⚠️ Áreas de Mejora Identificadas

### 1. Consistencia de Componentes

-   **Problema**: Dos sistemas de componentes (base UI y RUI)
-   **Impacto**: Posible confusión y duplicación
-   **Recomendación**: Consolidar en un solo sistema o documentar cuándo usar cada uno

### 2. Manejo de Rutas

-   **Problema**: Routing interno manejado manualmente en RuiDashboardApp
-   **Impacto**: Código complejo y difícil de mantener
-   **Recomendación**: Considerar usar un router cliente (React Router) o mejorar el sistema actual

### 3. TypeScript

-   **Estado**: Buen uso de TypeScript
-   **Mejora**: Algunos tipos podrían ser más estrictos (any implícitos)

### 4. Testing

-   **Estado**: Sin tests
-   **Recomendación**: Implementar tests unitarios y de integración

### 5. Documentación

-   **Estado**: README básico
-   **Recomendación**: Documentar componentes, hooks y servicios

### 6. Accesibilidad

-   **Estado**: Usa Radix UI (accesible por defecto)
-   **Mejora**: Auditar accesibilidad completa

### 7. Performance

-   **Mejora**: Implementar React.memo donde sea necesario
-   **Mejora**: Virtualización de listas largas
-   **Mejora**: Lazy loading de componentes

---

## ✅ Fortalezas

1. ✅ **Arquitectura moderna**: Astro + React es una combinación poderosa
2. ✅ **TypeScript**: Buen uso de tipos
3. ✅ **Internacionalización**: Soporte completo para múltiples idiomas
4. ✅ **Seguridad**: Manejo robusto de autenticación con refresh tokens
5. ✅ **UI Components**: Sistema de componentes bien estructurado
6. ✅ **Estado**: Zustand + React Query es una combinación efectiva
7. ✅ **Formularios**: Validación robusta con Zod
8. ✅ **Responsive**: Diseño adaptativo

---

## 📈 Métricas Estimadas

-   **Componentes React**: ~70+ componentes
-   **Hooks personalizados**: ~14 hooks
-   **Servicios API**: 7 servicios
-   **Páginas Astro**: ~15 páginas
-   **Idiomas**: 2 (es, en)
-   **Roles soportados**: 7 roles principales

---

## 🔮 Recomendaciones Futuras

1. **Testing**: Implementar suite de tests completa
2. **Storybook**: Documentar componentes con Storybook
3. **PWA**: Convertir en Progressive Web App
4. **Monitoreo**: Integrar error tracking (Sentry)
5. **Analytics**: Integrar analytics (opcional)
6. **CI/CD**: Automatizar builds y deployments
7. **Documentación**: Crear documentación técnica completa
8. **Performance**: Implementar métricas de performance (Web Vitals)

---

## 📚 Recursos y Referencias

-   **Astro Docs**: https://docs.astro.build
-   **React Query**: https://tanstack.com/query
-   **Zustand**: https://zustand-demo.pmnd.rs
-   **Radix UI**: https://www.radix-ui.com
-   **Tailwind CSS**: https://tailwindcss.com

---

**Fecha de Análisis**: Diciembre 2024
**Versión del Frontend**: 0.0.1
**Framework**: Astro 5.16.1 + React 19.2.1

