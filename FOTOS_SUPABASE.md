# Fotos en Supabase Storage

Esta versión usa el bucket privado `Epi-check-file`.

## Primera migración

1. Publica esta versión en GitHub Pages.
2. Abre EPI-Check e inicia sesión.
3. Ve a **Cuenta y sincronización**.
4. Pulsa **Subir y sincronizar todas las fotos**.
5. Mantén la app abierta hasta que confirme el proceso.

Las fotos nuevas se guardan primero en IndexedDB y después se suben automáticamente cuando hay internet.

## Recuperar en otro móvil

1. Inicia sesión con la misma cuenta.
2. Restaura primero los datos desde Supabase.
3. Vuelve a **Cuenta y sincronización**.
4. Pulsa **Recuperar fotos en este móvil**.

## Estructura del bucket

- `{user_id}/materiales/{material_id}/{photo_id}.jpg`
- `{user_id}/ubicaciones/{zona}/{photo_id}.jpg`
- `{user_id}/inspecciones/{inspection_id}/{photo_id}.jpg`

El bucket debe permanecer privado y las políticas RLS deben limitar el primer segmento de la ruta al `auth.uid()` del usuario.
