# Arquitectura base de EPI-Check

Esta versión conserva el comportamiento de la versión estable con Supabase, pero separa el archivo único en piezas mantenibles.

## Estructura

- `index.html`: estructura y modales.
- `css/`: estilos en el mismo orden en que se cargaban.
- `js/02-app-core.js`: núcleo histórico de la aplicación.
- `js/05-bottom-navigation.js`: navegación inferior.
- `js/07-android-back-stack.js`: botón Atrás de Android.
- `js/09-find-material.js`: modo Encontrar material.
- `js/13-strict-location-source.js`: fuente única de ubicación.
- `js/14-location-selector.js`: selector del plano.
- `js/15-number-highlight.js`: resaltado por número.
- `js/16-supabase-sync.js`: cuenta, migración y sincronización.
- `service-worker.js`: caché de GitHub Pages/PWA.

## Regla de mantenimiento

No se cambia `main` directamente. Cada mejora se prueba primero en una rama. La sincronización de fotos, el historial y la IA deben incorporarse como módulos nuevos, no dentro de `02-app-core.js`.
