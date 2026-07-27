# Modularización de EPI-Check

Esta edición conserva el orden de ejecución original, pero mueve los bloques JavaScript embebidos en `index.html` a archivos separados dentro de `js/`.

- No cambia las claves de localStorage ni IndexedDB.
- No cambia Supabase ni sus datos.
- Los scripts se cargan en el mismo punto y orden en el que estaban embebidos.
- El service worker precarga los módulos locales para mantener el funcionamiento offline.

Los nombres numéricos (`01-`, `02-`, etc.) indican el orden de carga.
