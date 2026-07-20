(function(){
    if (window.__epiResaltadoUbicacionLegacyFix) return;
    window.__epiResaltadoUbicacionLegacyFix = true;

    function textoUbicacionCompleto(item){
        if (!item || typeof item !== 'object') return '';
        return [
            item.donde,
            item.ubicacionFisica,
            item.ubicacionArmario,
            item.localizacion,
            item.zona,
            item.cajon,
            item.posicion,
            item.lugar,
            item.detalleUbicacion,
            item.ubicacionExacta
        ].filter(Boolean).join(' ');
    }

    var resolverAnterior = null;
    try { resolverAnterior = window.zonaArmarioDesdeItem || zonaArmarioDesdeItem; } catch(e) {}

    window.zonaArmarioDesdeItem = function(item){
        var texto = textoUbicacionCompleto(item);
        var zona = null;

        try {
            if (texto && typeof window.zonaArmarioDesdeTexto === 'function') {
                zona = window.zonaArmarioDesdeTexto(texto);
            } else if (texto && typeof zonaArmarioDesdeTexto === 'function') {
                zona = zonaArmarioDesdeTexto(texto);
            }
        } catch(e) {}

        if (zona && zona.key && zona.key !== 'sin-asignar') return zona;

        try {
            if (typeof resolverAnterior === 'function') {
                zona = resolverAnterior(item);
                if (zona) return zona;
            }
        } catch(e) {}

        return { key:'sin-asignar', n:'?', label:'Sin zona exacta', detalle:'Edita “Dónde exactamente” con Cajón 1, Cajón 8, Gaveta 6, etc.', color:'#22d3ee', icon:'fa-location-dot' };
    };

    // Mantiene también accesible la función como identificador global en navegadores WebView.
    try { zonaArmarioDesdeItem = window.zonaArmarioDesdeItem; } catch(e) {}
})();
