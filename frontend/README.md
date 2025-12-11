# CIP Eventos - Frontend

Sistema de gestión de eventos para el Colegio de Ingenieros del Perú. Plataforma moderna para crear, publicar y gestionar eventos, inscripciones, asistencias, certificados y más.

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| [Astro](https://astro.build) | 5.16+ | Framework SSR/SSG |
| [React](https://react.dev) | 19.2+ | UI Library |
| [TypeScript](https://typescriptlang.org) | Strict | Type Safety |
| [Tailwind CSS](https://tailwindcss.com) | 4.1+ | Estilos |
| [Zustand](https://zustand-demo.pmnd.rs) | 5.0+ | Estado global |
| [TanStack Query](https://tanstack.com/query) | 5.90+ | Server state |
| [React Hook Form](https://react-hook-form.com) | 7.66+ | Formularios |
| [Zod](https://zod.dev) | 3.24+ | Validación |

## Estructura del Proyecto

```
frontend/
├── public/                    # Assets estáticos
│   └── images/
├── src/
│   ├── components/            # Componentes React
│   │   ├── auth/              # Autenticación (Login, ForgotPassword, etc.)
│   │   ├── dashboard/         # Dashboard y estadísticas
│   │   ├── events/            # Gestión de eventos
│   │   ├── icons/             # Iconos personalizados
│   │   ├── layout/            # Layout (Header, Sidebar, AppLayout)
│   │   ├── organizers/        # Gestión de organizadores
│   │   ├── profile/           # Perfil de usuario
│   │   ├── providers/         # React Providers
│   │   ├── ui/                # Componentes UI base
│   │   │   └── form/          # Componentes de formulario RUI
│   │   └── users/             # Gestión de usuarios
│   ├── config/                # Configuración (navegación, etc.)
│   ├── constants/             # Constantes (roles, modalidades, etc.)
│   ├── hooks/                 # Custom React hooks
│   ├── i18n/                  # Internacionalización
│   │   └── locales/           # Traducciones (es.json, en.json)
│   ├── layouts/               # Layouts de Astro
│   ├── lib/                   # Utilidades y configuración
│   ├── pages/                 # File-based routing de Astro
│   ├── services/              # Servicios API
│   ├── store/                 # Zustand stores
│   ├── styles/                # Estilos globales
│   └── types/                 # TypeScript types
├── astro.config.mjs           # Configuración de Astro
├── components.json            # Configuración shadcn/ui
├── package.json
└── tsconfig.json
```

## Sistema de Diseño

Este proyecto implementa un sistema de diseño basado en **[Refactoring UI](https://refactoringui.com)** con una paleta de colores personalizada.

### Paleta de Colores

| Categoría | Token | Color | Uso |
|-----------|-------|-------|-----|
| **Primary** | `--color-red-500` | `#BA2525` | Identidad CIP, branding |
| **Action** | `--color-cyan-500` | `#2CB1BC` | CTAs, botones de acción |
| **Accent** | `--color-yellow-500` | `#F0B429` | Highlights, badges decorativos |
| **Success** | `--color-green-500` | `#7BB026` | Estados positivos |
| **Neutrals** | `--color-grey-*` | Warm Grey | UI general, textos, bordes |

### Estrategia de Estilos

El proyecto usa un **enfoque híbrido**:

1. **CSS Variables** (`global.css`) - Design tokens centralizados
2. **Inline Styles** - Componentes con estados interactivos (Button, Input)
3. **Tailwind Classes** - Layouts y utilidades rápidas
4. **CVA** - Compatibilidad con componentes shadcn/ui

```tsx
// Ejemplo: Componente con inline styles y tokens
const buttonStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-red-500)',
  height: 'var(--button-height-md)',
  // Estados interactivos manejados con useState
}
```

### Tokens de Spacing

```css
--space-1: 4px    --space-6: 24px
--space-2: 8px    --space-8: 32px
--space-3: 12px   --space-10: 40px
--space-4: 16px   --space-12: 48px
--space-5: 20px   --space-16: 64px
```

### Alturas de Botones

```css
--button-height-sm: 32px   /* Compacto */
--button-height-md: 36px   /* Default */
--button-height-lg: 40px   /* Prominente */
--button-height-xl: 44px   /* Touch target */
```

## Componentes UI

### Componentes Base (`components/ui/`)

- **Button** - Variantes: primary, secondary, ghost, outline, soft, danger, icon
- **Input** - Inputs de texto con estados y validación
- **Select** - Selector con Headless UI
- **DatePicker** / **TimePicker** - Selectores de fecha/hora
- **Dialog** / **Drawer** - Modales y paneles laterales
- **Table** / **Pagination** - Tablas con paginación

### Componentes de Formulario (`components/ui/form/`)

- **FormCard** - Card contenedor para secciones de formulario
- **FormGroup** - Agrupador de campos con spacing
- **FormRow** - Layout de grid para campos en línea
- **FormSelect** - Select con label, error y hint
- **FormTextarea** - Textarea con contador de caracteres

## Internacionalización (i18n)

El proyecto soporta **español** (default) e **inglés**.

### Rutas Localizadas

```
/eventos          → /en/events
/usuarios         → /en/users
/organizadores    → /en/organizers
/iniciar-sesion   → /en/login
```

### Uso en Componentes

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('dashboard.title')}</h1>
}
```

## Sistema de Roles

El sistema implementa control de acceso basado en roles:

| Rol | Descripción |
|-----|-------------|
| `SUPER_ADMIN` | Administrador de plataforma completa |
| `ORG_ADMIN` | Administrador de organizador |
| `ORG_STAFF_ACCESO` | Staff de control de acceso |
| `ORG_STAFF_ACADEMICO` | Staff de gestión académica |
| `ORG_FINANZAS` | Gestión financiera |
| `PONENTE` | Ponente/Speaker |
| `PARTICIPANTE` | Participante de eventos |

La navegación se filtra automáticamente según el rol del usuario (`config/navigation.ts`).

## Autenticación

- **JWT** con access token y refresh token
- **Refresh automático** cuando el token expira
- **Persistencia dual**: localStorage (remember me) o sessionStorage
- **Middleware de protección** de rutas (`middleware.ts`)

## Comandos

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Preview del build
pnpm preview
```

## Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```bash
# API Configuration
PUBLIC_API_URL=http://localhost:3000/api

# Assets URL
PUBLIC_ASSETS_URL=http://localhost:9000

# Auth routes
PUBLIC_LOGIN_PATH=/iniciar-sesion
PUBLIC_FORGOT_PASSWORD_PATH=/recuperar-contrasena
PUBLIC_CONFIRM_EMAIL_PATH=/auth/confirm
PUBLIC_RESET_PASSWORD_PATH=/auth/restablecer-contrasena
```

## Custom Hooks

| Hook | Propósito |
|------|-----------|
| `useLoginForm` | Lógica de formulario de login |
| `useEvents` | Fetching y filtrado de eventos |
| `useEventDetails` | Detalles de evento específico |
| `usePagination` | Paginación genérica |
| `useTableFilters` | Filtros de tabla genéricos |
| `useDialog` | Control de estado de diálogos |
| `useSessions` | CRUD de sesiones de evento |
| `useTickets` | CRUD de tickets |

## Servicios API

Los servicios están en `services/` y usan Axios con interceptors para autenticación:

```tsx
import { eventsService } from '@/services/events.service'

// Ejemplo de uso
const events = await eventsService.findAllPaginated(page, limit)
```

## Convenciones de Código

### Nomenclatura

- **Componentes**: PascalCase (`EventCard.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useEvents.ts`)
- **Servicios**: camelCase con sufijo `.service` (`events.service.ts`)
- **Types**: PascalCase (`Event`, `CreateEventDto`)

### Estructura de Componentes

```tsx
// 1. Imports
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Event } from '@/types/event'

// 2. Types/Interfaces
interface Props {
  event: Event
}

// 3. Component
export function EventCard({ event }: Props) {
  const { t } = useTranslation()
  // ...
}
```

## Arquitectura de Páginas

Las páginas de Astro actúan como contenedores SSR que hidratan componentes React:

```astro
---
// src/pages/eventos/index.astro
import Layout from '@/layouts/Layout.astro'
import { EventsView } from '@/components/events/EventsView'
---

<Layout title="Eventos">
  <EventsView client:only="react" />
</Layout>
```

## Contribuir

1. Crear rama desde `dev`: `git checkout -b feature/mi-feature`
2. Seguir las convenciones de código
3. Usar tokens de diseño de `global.css`
4. Asegurar soporte i18n para nuevos textos
5. Crear PR hacia `dev`

## Recursos

- [Documentación de Astro](https://docs.astro.build)
- [Refactoring UI](https://refactoringui.com)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/docs)
- [TanStack Query](https://tanstack.com/query/latest/docs)
