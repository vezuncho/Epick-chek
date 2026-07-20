// ================================================================
// EPI-CHECK · BLOQUEO ESTRICTO Y REINICIO DE UBICACIONES
// La casilla "Dónde exactamente" es la única fuente válida.
// ================================================================
(function () {
    'use strict';

    function ubicacionExactaEscrita(item) {
        if (!item || typeof item !== 'object') return '';
        return String(item.donde || '').trim();
    }

    // Sustituye la compatibilidad antigua: no se ilumina nada si la casilla está vacía.
    obtenerUbicacionFisica = function (item) {
        return ubicacionExactaEscrita(item);
    };

    tieneUbicacionAsignada = function (item) {
        return ubicacionExactaEscrita(item).length > 0;
    };

    // Evita que el plano deduzca una zona por nombres antiguos, categorías o datos residuales.
    if (typeof resolverZonaArmario === 'function') {
        const resolverZonaArmarioOriginal = resolverZonaArmario;
        resolverZonaArmario = function (item) {
            const texto = ubicacionExactaEscrita(item);
            if (!texto) {
                return {
                    key: 'sin-asignar', n: '?', label: 'Sin ubicación',
                    detalle: 'La casilla “Dónde exactamente” está vacía.',
                    color: '#64748b', icon: 'fa-location-dot'
                };
            }
            // Se pasa una copia limpia para impedir que campos heredados influyan.
            const limpio = Object.assign({}, item, {
                donde: texto,
                ubicacionFisica: '', ubicacionArmario: '', localizacion: '',
                zona: '', cajon: '', posicion: '', lugar: '',
                detalleUbicacion: '', ubicacionExacta: ''
            });
            return resolverZonaArmarioOriginal(limpio);
        };
    }

    window.resetearTodasLasUbicacionesMaterial = function () {
        const lista = (typeof inventario !== 'undefined' && Array.isArray(inventario)) ? inventario : [];
        const total = lista.length;
        const mensaje = total
            ? `Se borrará la ubicación exacta de los ${total} materiales. Después tendrás que asignarlas de nuevo.\n\n¿Continuar?`
            : 'Se borrarán todas las ubicaciones exactas guardadas.\n\n¿Continuar?';
        if (!confirm(mensaje)) return;

        const limpiarCampos = function (item) {
            if (!item || typeof item !== 'object') return item;
            item.donde = '';
            // Eliminar todos los nombres usados por parches y versiones antiguas.
            delete item.ubicacionFisica;
            delete item.ubicacionArmario;
            delete item.localizacion;
            delete item.zona;
            delete item.cajon;
            delete item.posicion;
            delete item.lugar;
            delete item.detalleUbicacion;
            delete item.ubicacionExacta;
            return item;
        };

        lista.forEach(limpiarCampos);

        let guardadoCorrecto = false;
        try {
            // Guardado directo y verificable: evita que otro parche vuelva a serializar
            // campos antiguos o que un error quede oculto.
            const limpio = (typeof prepararInventarioParaGuardar === 'function')
                ? prepararInventarioParaGuardar().map(limpiarCampos)
                : lista.map(item => limpiarCampos(Object.assign({}, item)));
            localStorage.setItem('app_epicheck_pestanas_ordenadas', JSON.stringify(limpio));

            const comprobacion = JSON.parse(localStorage.getItem('app_epicheck_pestanas_ordenadas') || '[]');
            guardadoCorrecto = Array.isArray(comprobacion) && comprobacion.every(function (item) {
                return !String((item && item.donde) || '').trim()
                    && !item?.ubicacionFisica && !item?.ubicacionArmario
                    && !item?.localizacion && !item?.zona && !item?.cajon
                    && !item?.posicion && !item?.lugar
                    && !item?.detalleUbicacion && !item?.ubicacionExacta;
            });
        } catch (error) {
            console.error('No se pudieron guardar las ubicaciones reiniciadas:', error);
        }

        try { if (typeof renderApp === 'function') renderApp(); } catch (_) {}
        try { if (typeof actualizarContadores === 'function') actualizarContadores(); } catch (_) {}
        try { if (typeof actualizarPinesUbicacionTarjetas === 'function') actualizarPinesUbicacionTarjetas(); } catch (_) {}
        try { if (typeof toggleSidebar === 'function') toggleSidebar(false); } catch (_) {}

        if (!guardadoCorrecto) {
            alert('No se pudo guardar el reinicio de ubicaciones. No cierres la app y libera espacio interno de la aplicación antes de repetirlo.');
            return;
        }

        try {
            if (typeof feedbackEpi === 'function') feedbackEpi('Ubicaciones borradas y guardadas de forma permanente.', 'ok');
            else alert('Ubicaciones borradas y guardadas de forma permanente.');
        } catch (_) {
            alert('Ubicaciones borradas y guardadas de forma permanente.');
        }
    };

    // Actualización inmediata del pin al escribir, borrar o guardar la casilla.
    document.addEventListener('input', function (ev) {
        if (ev.target && ev.target.id === 'form-donde') {
            ev.target.value = ev.target.value.replace(/^\s+/, '');
        }
    }, true);
})();
