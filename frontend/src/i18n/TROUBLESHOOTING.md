# Troubleshooting i18n

## Problemas comunes y soluciones

### ❌ Error: `NO_I18NEXT_INSTANCE`

```
react-i18next:: useTranslation: You will need to pass in an i18next instance
```

**Causa:** i18next no se inicializó antes de que los componentes React intenten usarlo.

**Solución:** Asegúrate de que `src/i18n/index.ts` se importe en `Layout.astro`:

```astro
<script>
  import '../i18n';
</script>
```

### ⚠️ Warning: `Astro.request.headers` not available

```
`Astro.request.headers` was used when rendering the route... not available on prerendered pages
```

**Causa:** Intentar acceder a `Astro.cookies` o `Astro.request.headers` en páginas pre-renderizadas (SSG).

**Solución:** Usar localStorage del lado del cliente:

```astro
<script>
  const savedLang = localStorage.getItem('i18nextLng') || 'es';
  document.documentElement.lang = savedLang;
</script>
```

### ❌ Traducciones no cambian después de usar `changeLanguage()`

**Causa:** El atributo `lang` del HTML está hardcodeado.

**Solución:** Actualizar dinámicamente con JavaScript (ver arriba).

### ❌ Componentes React no detectan cambio de idioma

**Causa:** El componente no está suscrito a cambios de idioma.

**Solución:** Asegúrate de usar el hook `useTranslation()`:

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t, i18n } = useTranslation();

  // ✅ Esto se actualizará cuando cambie el idioma
  return <h1>{t("welcome")}</h1>;
}
```

### ❌ TypeScript no autocompleta las keys de traducción

**Causa:** El archivo de tipos no se está cargando.

**Solución:** Verifica que `src/types/i18next.d.ts` existe y que `tsconfig.json` incluye:

```json
{
  "include": ["**/*"]
}
```

### ❌ Plurales no funcionan correctamente

**Causa:** Formato incorrecto de las keys.

**Solución:** Usa el sufijo `_one` y `_other`:

```json
{
  "item_one": "{{count}} item",
  "item_other": "{{count}} items"
}
```

Uso: `t("item", { count: 5 })`

### 🔍 Modo Debug

Para ver logs de i18next en desarrollo, abre la consola del navegador. El modo debug está activado automáticamente en desarrollo:

```ts
debug: import.meta.env.DEV
```

Verás logs como:
- `i18next: languageChanged es`
- `i18next: initialized {...}`
- `i18next: loading namespace translation for language es`

## Verificar que i18n funciona correctamente

Abre la consola del navegador y ejecuta:

```js
// Ver idioma actual
console.log(window.i18next?.language)

// Cambiar idioma
window.i18next?.changeLanguage('en')

// Ver traducción
window.i18next?.t('welcome')
```

## SSR vs SSG

**Actualmente:** La aplicación usa SSG (Static Site Generation) por defecto.

**Si necesitas SSR:** Agrega a `astro.config.mjs`:

```js
export default defineConfig({
  output: 'server', // o 'hybrid'
  // ...
});
```

Entonces podrás usar `Astro.cookies` en Layout.astro para detectar el idioma en el servidor.
