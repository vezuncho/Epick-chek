(function(){
    function safeText(v){
        if (typeof window.esc === 'function') return window.esc(v);
        return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
    }
    function listaInventario(){
        try { if (Array.isArray(window.inventario)) return window.inventario; } catch(e) {}
        try { if (Array.isArray(inventario)) return inventario; } catch(e) {}
        return [];
    }
    function getZona(item){
        try { if (typeof window.zonaArmarioDesdeItem === 'function') return window.zonaArmarioDesdeItem(item); } catch(e) {}
        try { if (typeof zonaArmarioDesdeItem === 'function') return zonaArmarioDesdeItem(item); } catch(e) {}
        return { key:'sin-asignar', n:'?', label:'Sin zona exacta', detalle:'Edita la ubicación exacta.', color:'#22d3ee' };
    }
    function getUbicacion(item){
        try { if (typeof window.etiquetaUbicacionFind === 'function') return window.etiquetaUbicacionFind(item); } catch(e) {}
        try { if (typeof etiquetaUbicacionFind === 'function') return etiquetaUbicacionFind(item); } catch(e) {}
        var partes = [];
        if (item && item.ubicacion) partes.push(item.ubicacion);
        if (item && item.donde) partes.push(item.donde);
        if (item && item.ubicacionFisica) partes.push(item.ubicacionFisica);
        return partes.join(' · ') || 'Sin ubicación';
    }
    function contarFotosZona(key){
        try { if (key && typeof fotosZonaPlano === 'function') return fotosZonaPlano(key).length || 0; } catch(e) {}
        try { if (key && typeof window.fotosZonaPlano === 'function') return window.fotosZonaPlano(key).length || 0; } catch(e) {}
        return 0;
    }
    function cerrarBuscador(){
        var g = document.getElementById('modal-generico-overlay');
        if (g) g.remove();
    }
    function crearOverlay(){
        var old = document.getElementById('modal-mapa-armario-overlay');
        if (old) old.remove();
        var overlay = document.createElement('div');
        overlay.id = 'modal-mapa-armario-overlay';
        overlay.className = 'fixed inset-0 bg-black/90 z-[9999] flex items-end justify-center';
        document.body.appendChild(overlay);
        return overlay;
    }
    window.abrirRutaEncontrarMaterial = function(id){
        var item = listaInventario().find(function(x){ return String(x && x.id) === String(id); });
        if (!item) {
            if (typeof window.feedbackEpi === 'function') window.feedbackEpi('No se encontró el material', 'warn');
            return;
        }
        var zona = getZona(item);
        var tieneZona = !!(zona && zona.key && zona.key !== 'sin-asignar');
        var nombre = item.equipo || item.nombre || 'Material';
        var ubicacion = getUbicacion(item);
        var zonaLabel = (zona && zona.label) ? zona.label : 'Sin zona exacta';
        var zonaKey = (zona && zona.key) ? zona.key : '';
        var fotosCount = contarFotosZona(zonaKey);
        cerrarBuscador();
        var overlay = crearOverlay();
        var armarioHtml = '';
        try {
            if (typeof window.renderArmarioInteractivo === 'function') armarioHtml = window.renderArmarioInteractivo(zona);
            else if (typeof renderArmarioInteractivo === 'function') armarioHtml = renderArmarioInteractivo(zona);
        } catch(e) {
            console.error(e);
        }
        if (!armarioHtml) {
            armarioHtml = '<div class="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">No está disponible el plano del armario.</div>';
        }
        var btnInterior = '';
        if (zonaKey && fotosCount > 0) {
            btnInterior = '<button type="button" onclick=\'abrirFotoInteriorPlano(' + JSON.stringify(zonaKey) + ',0)\' class="bg-cyan-700 hover:bg-cyan-600 active:scale-[0.98] border border-cyan-500 text-white rounded-xl px-3 py-2 text-[11px] font-black"><i class="fa-solid fa-camera mr-1"></i>Ver interior (' + fotosCount + ')</button>';
        } else {
            btnInterior = '<span class="text-[10px] text-slate-500 font-bold">Sin foto interior</span>';
        }
        overlay.innerHTML = '' +
            '<div class="w-full max-w-md bg-slate-950 rounded-t-2xl border-t border-slate-700 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">' +
                '<div class="p-4 border-b border-slate-800 bg-slate-900 flex items-start justify-between gap-3 shrink-0">' +
                    '<div class="min-w-0">' +
                        '<div class="text-[10px] uppercase tracking-wider font-black text-cyan-400 mb-1"><i class="fa-solid fa-location-crosshairs mr-1"></i> Modo encontrar material</div>' +
                        '<h2 class="text-base font-black text-slate-100 truncate">' + safeText(nombre) + '</h2>' +
                        '<p class="text-xs text-cyan-300 mt-0.5 truncate"><i class="fa-solid fa-map-pin mr-1"></i>' + safeText(ubicacion) + '</p>' +
                        '<p class="text-[11px] ' + (tieneZona ? 'text-emerald-300' : 'text-amber-300') + ' mt-1 truncate"><i class="fa-solid ' + (tieneZona ? 'fa-bullseye' : 'fa-triangle-exclamation') + ' mr-1"></i>' + safeText(zonaLabel) + (tieneZona ? ' resaltada' : ' no asignada') + '</p>' +
                    '</div>' +
                    '<button type="button" onclick="document.getElementById(\'modal-mapa-armario-overlay\')?.remove()" class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 shrink-0"><i class="fa-solid fa-xmark"></i></button>' +
                '</div>' +
                '<div class="overflow-auto p-3 space-y-3 grow overscroll-contain">' +
                    '<div class="rounded-2xl border border-cyan-800/70 bg-cyan-950/25 p-3 text-xs text-cyan-100 font-bold"><i class="fa-solid fa-circle-info mr-1"></i>La zona del material aparece marcada en el plano.</div>' +
                    armarioHtml +
                '</div>' +
                '<div class="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2 shrink-0">' +
                    '<button type="button" onclick="document.getElementById(\'modal-mapa-armario-overlay\')?.remove(); abrirModoEncontrarMaterial();" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-[11px] font-black"><i class="fa-solid fa-magnifying-glass mr-1"></i>Buscar otro</button>' +
                    btnInterior +
                '</div>' +
            '</div>';
        if (!tieneZona && typeof window.feedbackEpi === 'function') window.feedbackEpi('El material no tiene cajón/bandeja exacto. Edita “Dónde exactamente”.', 'warn');
        else if (typeof window.feedbackEpi === 'function') window.feedbackEpi('Ubicación resaltada en el plano', 'ok');
    };
})();
