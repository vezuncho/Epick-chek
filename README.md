# EPI-Check · Supabase Fase 1

Esta versión parte del paquete de GitHub con resaltado por número e incorpora:

- Registro e inicio de sesión por correo y contraseña.
- Subida manual segura de los datos actuales del móvil.
- Restauración manual desde Supabase.
- Sincronización automática después de realizar la primera subida.
- Cola práctica sin conexión: los datos siguen guardándose localmente y se vuelven a intentar al recuperar internet.

## Lo que se sincroniza en esta fase

- Inventario y sus campos.
- Ubicaciones.
- Nombres y configuración del plano.
- Historiales e inspecciones almacenados localmente.
- Datos del vehículo.
- Ajustes de la app.

## Lo que todavía no se sincroniza

Las fotos originales guardadas en IndexedDB. Se mantienen en el móvil y se añadirán en la Fase 2 mediante Supabase Storage. Las referencias y miniaturas que estén en localStorage pueden formar parte del estado, pero no deben considerarse una copia completa de las fotografías.

## Primera prueba

1. Sustituye los archivos del repositorio por el contenido de esta carpeta.
2. Espera a que GitHub Pages publique la actualización.
3. Abre la app y ve a **Menú → Ajustes → Cuenta y sincronización**.
4. Crea una cuenta o inicia sesión.
5. Pulsa **Subir los datos actuales de este móvil**.
6. Comprueba en Supabase, tabla `epi_check_state`, que aparece una fila.
7. Haz un cambio pequeño en un material y espera a que el estado indique **Sincronizado**.

## Seguridad

El frontend contiene solo la URL pública del proyecto y la clave `sb_publishable_`. La protección depende de las políticas RLS ya creadas. No añadas ninguna clave `sb_secret_` o `service_role` a GitHub.

## Corrección de edición móvil (23/07/2026)

- La ventana de alta/edición tiene desplazamiento vertical independiente.
- La cabecera y el botón de guardado permanecen visibles.
- En edición, el botón muestra «Guardar cambios».
- Se respeta la zona segura inferior del móvil.
- No se ha modificado la lógica de inventario, Supabase, fotos ni navegación.
