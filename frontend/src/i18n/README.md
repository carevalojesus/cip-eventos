# Sistema de Internacionalización (i18n)

Este proyecto utiliza **i18next** con **react-i18next** para la internacionalización.

## Características

- ✅ Detección automática de idioma del navegador
- ✅ Persistencia en localStorage
- ✅ Soporte para interpolación de variables
- ✅ Soporte para plurales
- ✅ Type-safety con TypeScript
- ✅ Modo debug en desarrollo
- ✅ Idiomas: Español (es) e Inglés (en)

## Uso en componentes React

### Hook useTranslation

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("greeting", { name: "Juan" })}</p>
      <p>{t("event_count", { count: 5 })}</p>
    </div>
  );
}
```

### Cambiar idioma

```tsx
import { useTranslation } from "react-i18next";

function LanguageButton() {
  const { i18n } = useTranslation();

  return (
    <button onClick={() => i18n.changeLanguage("en")}>
      English
    </button>
  );
}
```

## Uso en componentes Astro

```astro
---
import { t } from "@/i18n/utils";

const title = t("dashboard.title");
---

<h1>{title}</h1>
```

## Componente LanguageSelector

Ya existe un componente listo para usar:

```tsx
import { LanguageSelector } from "@/components/ui/LanguageSelector";

<LanguageSelector />
```

## Estructura de traducciones

Las traducciones están en `src/i18n/locales/`:
- `es.json` - Español
- `en.json` - Inglés

### Interpolación

```json
{
  "greeting": "Hola {{name}}"
}
```

Uso: `t("greeting", { name: "Juan" })` → "Hola Juan"

### Plurales

```json
{
  "event_count_one": "{{count}} evento",
  "event_count_other": "{{count}} eventos"
}
```

Uso:
- `t("event_count", { count: 1 })` → "1 evento"
- `t("event_count", { count: 5 })` → "5 eventos"

### Traducciones anidadas

```json
{
  "login": {
    "title": "Iniciar Sesión",
    "email": "Correo Electrónico"
  }
}
```

Uso: `t("login.title")` → "Iniciar Sesión"

## Agregar un nuevo idioma

1. Crear archivo en `src/i18n/locales/`, ej: `fr.json`
2. Agregar al objeto `resources` en `src/i18n/index.ts`:
   ```ts
   import fr from "./locales/fr.json";

   const resources = {
     es: { translation: es },
     en: { translation: en },
     fr: { translation: fr }, // Nuevo
   };
   ```
3. Agregar al LanguageSelector:
   ```ts
   { code: "fr", name: "Français", flag: "🇫🇷" }
   ```

## Type-safety

El archivo `src/types/i18next.d.ts` proporciona autocompletado en TypeScript:

```ts
// ✅ Autocompletado funciona
t("login.title")

// ❌ Error en tiempo de desarrollo
t("login.invalid_key")
```

## Configuración

La configuración está en `src/i18n/index.ts`:

- **fallbackLng**: Idioma por defecto (`"es"`)
- **debug**: Activado en desarrollo para ver logs
- **detection**: Detecta idioma de localStorage primero, luego del navegador
- **interpolation**: XSS protection desactivado (React lo maneja)

## Mejores prácticas

1. **Usa claves descriptivas**: `login.title` en vez de `lt`
2. **Agrupa por contexto**: `login.*`, `dashboard.*`, `errors.*`
3. **Evita hardcodear texto**: Siempre usa `t()`
4. **Mantén consistencia**: Mismas keys en todos los idiomas
5. **Usa interpolación**: Para contenido dinámico
6. **Usa plurales**: Para cantidades variables
