# EPI-Check — base modular

Base estable para GitHub Pages y Supabase. Conserva los datos locales y la sincronización de la fase 1, pero separa estilos y JavaScript para reducir el riesgo de romper toda la aplicación con cada cambio.

## Publicar

Sube el contenido de esta carpeta al repositorio, manteniendo las carpetas `css`, `js` y `.github`. GitHub Actions publicará la aplicación.

## Antes de sustituir la versión estable

Publica esta base en una rama de prueba o en un repositorio de pruebas. Sigue `PRUEBAS_BASE.md`. Solo después combínala con `main`.

## Seguridad

La clave publicable de Supabase puede estar en el cliente con RLS activado. Nunca incluyas una clave `sb_secret_` ni `service_role`.


## Exportaciones añadidas

En **Ajustes → Copias y exportación** se pueden descargar:

- Todos los datos.
- Todas las incidencias.
- Herramientas que faltan.
- Herramientas deterioradas.
- Equipos caducados de EPIs, furgoneta y grúa.

Al exportar **Todo + Excel**, el archivo genera hojas separadas para cada informe, además de la hoja del vehículo.
