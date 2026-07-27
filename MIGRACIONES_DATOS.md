# Sistema de migraciones de datos

Versión actual del esquema: **2**.

- El módulo `js/00-data-migrations.js` se ejecuta antes de cargar la lógica principal.
- No cambia las claves existentes de LocalStorage ni las bases IndexedDB.
- Antes de cada migración crea una copia auxiliar de las claves críticas cuando hay espacio disponible.
- Las migraciones son incrementales e idempotentes: solo se ejecutan una vez por versión.
- La versión se guarda en `app_epicheck_data_schema_version`.
- El registro de resultados se guarda en `app_epicheck_migration_log`.

## Migraciones incluidas

- **0 → 1:** valida contenedores principales y añade el array `fotos` solo a registros que no lo tengan.
- **1 → 2:** añade `perfilArmario: "auto"` a vehículos anteriores y valida historial y adjuntos.

Las futuras modificaciones de estructura deben añadir una migración nueva; nunca deben reinicializar inventario ni borrar IndexedDB.
