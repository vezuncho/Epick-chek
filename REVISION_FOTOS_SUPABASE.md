# Revisión de fotos en Supabase Storage

Esta versión corrige la conexión real entre IndexedDB y Supabase Storage.

## Correcciones principales

- Expone explícitamente `guardarFotoDB`, `leerFotoDB` y `borrarFotoDB` al módulo de sincronización.
- El botón principal **Subir los datos actuales de este móvil** sincroniza también las fotos.
- Migra las fotos existentes vinculadas a materiales y EPIs.
- Mantiene la subida automática de fotos nuevas.
- Muestra un diagnóstico concreto si falla sesión, conexión o acceso al almacén local.
- Usa el bucket privado exacto `Epi-check-file` y rutas que comienzan por el `user_id`.

## Primera prueba

1. Inicia sesión en EPI-Check.
2. Abre **Cuenta y sincronización**.
3. Pulsa **Subir los datos actuales de este móvil**.
4. Acepta la confirmación y mantén la app abierta.
5. En Supabase abre Storage > `Epi-check-file` y actualiza la vista.

Debe aparecer una carpeta cuyo nombre es el identificador del usuario.
