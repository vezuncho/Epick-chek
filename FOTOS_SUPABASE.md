# Fotos en Supabase Storage

Esta versión usa el bucket privado `Epi-check-file`.

## Funcionamiento

1. La foto se guarda primero en IndexedDB para que la app siga funcionando sin conexión.
2. Si hay una sesión de Supabase e internet, se sube automáticamente.
3. Si falla la conexión, queda en una cola persistente y se reintenta al volver a estar online.
4. En otro dispositivo, las fotos que falten se recuperan desde Supabase.
5. Al borrar una foto, también se elimina del bucket; si no hay conexión, el borrado queda pendiente.

## Rutas

- `{user_id}/materiales/{item_id}/...`
- `{user_id}/epis/{item_id}/...`
- `{user_id}/ubicaciones/{zona}/...`
- `{user_id}/inspecciones/{inspeccion_id}/...`

## Panel de control

En `Cuenta y sincronización` se muestran:

- Fotos locales.
- Fotos enlazadas en Supabase.
- Operaciones pendientes.
- Errores que necesitan reintento.

Incluye botones para sincronizar, recuperar y reintentar errores.
