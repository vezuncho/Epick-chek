# EPI-Check · cinco pasos de estabilidad

1. Validación de ubicaciones: comprueba materiales sin ubicación exacta o incompatibles con el plano activo.
2. Tarjetas compactas: reduce espacios exteriores sin ocultar información.
3. Transporter Armario B: perfil preparado y marcado como pendiente hasta disponer de imagen y zonas reales.
4. Modularización adicional: validación, gestor de vehículos y estilos están en archivos independientes.
5. Gestor de vehículos: permite crear y cambiar perfiles locales, guardando una instantánea antes de cada cambio.

## Protección de datos
- No se cambian las claves existentes de Supabase.
- No se borran datos locales ni IndexedDB.
- El gestor de vehículos conserva instantáneas locales separadas.
