# Perfiles de furgoneta

La app detecta el plano mediante los campos **Marca** y **Modelo** de la ficha del vehículo.

- Si encuentra un perfil compatible, muestra su imagen y sus ubicaciones.
- Si no lo encuentra, conserva el armario actual como plano genérico.
- Cada perfil puede tener una imagen y un conjunto de zonas diferentes.

La biblioteca está en el bloque `epi-perfiles-furgoneta-v1` de `index.html`.
Para añadir un plano se incorpora un objeto con:

- `id`
- `nombre`
- `coincidencias`: lista de marcas y modelos compatibles
- `imagen`: imagen Base64 o ruta local
- `zonas`: listado de zonas resaltables

El sistema normaliza mayúsculas, minúsculas, tildes, espacios y guiones al comparar marca y modelo.
