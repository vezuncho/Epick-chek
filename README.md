# EPI-Check en GitHub Pages

Este repositorio contiene la versión web instalable de EPI-Check.

## Publicarla por primera vez

1. Entra en GitHub y pulsa **New repository**.
2. Ponle un nombre sencillo, por ejemplo `epi-check`.
3. Elige **Private** si tu plan permite GitHub Pages privado; en GitHub Free, lo más sencillo es usar un repositorio **Public**. No subas contraseñas, claves privadas ni datos personales reales.
4. Crea el repositorio sin añadir README, licencia ni `.gitignore`.
5. Dentro del repositorio, pulsa **Add file → Upload files**.
6. Sube **todo el contenido de esta carpeta**, incluida la carpeta oculta `.github`. No subas la carpeta contenedora como una sola carpeta.
7. Pulsa **Commit changes**.
8. Ve a **Settings → Pages**.
9. En **Build and deployment → Source**, selecciona **GitHub Actions**.
10. Abre la pestaña **Actions** y espera a que `Deploy GitHub Pages` termine en verde.
11. Vuelve a **Settings → Pages**. Allí aparecerá la dirección pública, normalmente:
   `https://TU-USUARIO.github.io/epi-check/`

## Instalarla en Android

1. Abre la dirección publicada con Chrome.
2. Menú de Chrome → **Añadir a pantalla de inicio** o **Instalar aplicación**.
3. Abre EPI-Check desde el icono instalado.

## Actualizar la aplicación

1. Sustituye `index.html` o los archivos modificados en el repositorio.
2. Haz un nuevo commit.
3. GitHub Actions volverá a publicar automáticamente.
4. Si el móvil sigue mostrando una versión antigua, cierra la app, vuelve a abrirla con internet y, si hace falta, borra la caché del sitio.

## Datos y fotos

GitHub Pages solo publica los archivos de la aplicación. Los datos que introduces siguen guardándose en el navegador del dispositivo mediante `localStorage` e `IndexedDB`; no se sincronizan entre móviles ni se guardan automáticamente en GitHub.

Para sincronización real y copias en la nube, debe conectarse Supabase posteriormente. Nunca pongas una clave `service_role` de Supabase dentro de `index.html`; en una aplicación web solo debe utilizarse la clave pública `anon` junto con políticas RLS.

## Archivos principales

- `index.html`: aplicación.
- `manifest.json`: instalación como PWA.
- `service-worker.js`: funcionamiento sin conexión y caché.
- `icon-192.png` y `icon-512.png`: iconos.
- `.github/workflows/pages.yml`: publicación automática.
- `.nojekyll`: sirve los archivos como web estática sin procesamiento de Jekyll.
