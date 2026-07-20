(function(){
    if (window.__epiModoEncontrarMaterial) return;
    window.__epiModoEncontrarMaterial = true;

    function normFind(txt){
        return String(txt || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
            .toLowerCase()
            .replace(/[^a-z0-9ñü\s\-_.\/]/g,' ')
            .replace(/\s+/g,' ')
            .trim();
    }

    function itemTextoBusquedaFind(item){
        if (!item) return '';
        const archivos = Array.isArray(item.archivos) ? item.archivos.map(a => [a && a.nombre, a && a.name, a && a.filename].filter(Boolean).join(' ')).join(' ') : '';
        return normFind([
            item.equipo, item.nombre, item.marca, item.modelo, item.serie, item.codigo,
            item.estado, item.estadoOperativo, item.ubicacion, item.sububicacion, item.categoria,
            item.donde, item.ubicacionFisica, item.zona, item.localizacion, item.debeHaber, item.falta,
            archivos
        ].filter(Boolean).join(' '));
    }

    function etiquetaUbicacionFind(item){
        const mapa = {personal:'EPIs personales', furgoneta:'Furgoneta', grua:'Grúa', herramienta:'Herramientas'};
        const base = mapa[item && item.ubicacion] || 'Material';
        const donde = String((item && (item.donde || item.ubicacionFisica || item.zona || item.localizacion)) || '').trim();
        return donde ? `${base} · ${donde}` : base;
    }

    function estadoBadgeFind(item){
        const falta = String((item && item.falta) || '').toLowerCase();
        const estado = String((item && item.estadoOperativo) || '').toLowerCase();
        if (falta === 'falta' || estado === 'vencido') return '<span class="bg-red-950/60 border border-red-700 text-red-300 rounded-lg px-2 py-1 text-[10px] font-black">INCIDENCIA</span>';
        if (falta === 'deteriorado') return '<span class="bg-orange-950/60 border border-orange-700 text-orange-300 rounded-lg px-2 py-1 text-[10px] font-black">DETERIORADO</span>';
        if (falta === 'calibrando') return '<span class="bg-sky-950/60 border border-sky-700 text-sky-300 rounded-lg px-2 py-1 text-[10px] font-black">CALIBRANDO</span>';
        return '<span class="bg-emerald-950/50 border border-emerald-700 text-emerald-300 rounded-lg px-2 py-1 text-[10px] font-black">OK</span>';
    }

    function buscarMaterialesFind(q){
        const terms = normFind(q).split(' ').filter(Boolean);
        let base = Array.isArray(window.inventario) ? window.inventario : (typeof inventario !== 'undefined' ? inventario : []);
        if (!terms.length) return base.slice(0, 25);
        return base.map(item => {
            const txt = itemTextoBusquedaFind(item);
            let score = 0;
            terms.forEach(t => { if (txt.includes(t)) score += 10; });
            const equipo = normFind(item && item.equipo);
            terms.forEach(t => { if (equipo.startsWith(t)) score += 5; });
            return {item, score};
        }).filter(x => x.score > 0)
          .sort((a,b) => b.score - a.score || String(a.item.equipo||'').localeCompare(String(b.item.equipo||'')))
          .map(x => x.item)
          .slice(0, 40);
    }

    function renderResultadosEncontrarMaterial(q){
        const cont = document.getElementById('epi-find-results');
        if (!cont) return;
        const results = buscarMaterialesFind(q);
        const safeQ = (window.esc ? esc(q) : String(q||''));
        if (!results.length) {
            cont.innerHTML = `<div class="rounded-2xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200"><i class="fa-solid fa-triangle-exclamation mr-1"></i>No encontré material con “${safeQ}”. Prueba con marca, código, cajón o categoría.</div>`;
            return;
        }
        cont.innerHTML = results.map(item => {
            const zona = (typeof zonaArmarioDesdeItem === 'function') ? zonaArmarioDesdeItem(item) : null;
            const zonaTexto = zona && zona.key !== 'sin-asignar' ? `${zona.label}` : 'Sin zona exacta';
            const zonaColor = zona && zona.color ? zona.color : '#22d3ee';
            const title = window.esc ? esc(item.equipo || 'Material sin nombre') : String(item.equipo || 'Material sin nombre');
            const meta = window.esc ? esc([item.marca, item.modelo, item.codigo].filter(Boolean).join(' · ') || 'Sin marca/modelo/código') : '';
            const ubic = window.esc ? esc(etiquetaUbicacionFind(item)) : etiquetaUbicacionFind(item);
            const id = window.esc ? esc(item.id) : String(item.id||'');
            return `<div class="rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-sm">
                <div class="flex items-start gap-3">
                    <div class="w-11 h-11 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 flex items-center justify-center shrink-0"><i class="fa-solid fa-magnifying-glass-location"></i></div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-start gap-2 justify-between"><h4 class="text-sm font-black text-slate-100 leading-tight">${title}</h4>${estadoBadgeFind(item)}</div>
                        <p class="text-[11px] text-slate-400 mt-0.5 truncate">${meta}</p>
                        <div class="mt-2 flex flex-wrap gap-1.5">
                            <span class="inline-flex items-center gap-1 rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300"><i class="fa-solid fa-location-dot text-cyan-300"></i>${ubic}</span>
                            <span class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black text-white" style="background:${zonaColor}cc"><i class="fa-solid fa-map-pin"></i>${window.esc ? esc(zonaTexto) : zonaTexto}</span>
                        </div>
                    </div>
                </div>
                <button type="button" onclick="abrirRutaEncontrarMaterial('${id}')" class="w-full mt-3 bg-cyan-700 hover:bg-cyan-600 active:scale-[0.98] border border-cyan-500 text-white rounded-xl py-2.5 text-xs font-black"><i class="fa-solid fa-route mr-1"></i>Encontrar este material</button>
            </div>`;
        }).join('');
    }

    window.abrirModoEncontrarMaterial = function(qInicial){
        const q = qInicial || '';
        const html = `<div class="space-y-3">
            <div class="rounded-2xl border border-cyan-800 bg-cyan-950/25 p-3">
                <div class="text-xs font-black text-cyan-300 uppercase"><i class="fa-solid fa-location-crosshairs mr-1"></i>Modo encontrar material</div>
                <p class="text-[11px] text-slate-300 mt-1 leading-relaxed">Busca un material y la app te lleva al plano, resalta su cajón/bandeja y te deja abrir las fotos interiores.</p>
            </div>
            <div class="relative">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                <input id="epi-find-input" value="${window.esc ? esc(q) : q}" class="w-full bg-slate-950 border border-slate-600 rounded-xl pl-9 pr-3 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500" placeholder="Ej.: Fluke, casco, cajón 3, alicates..." oninput="renderResultadosEncontrarMaterial(this.value)">
            </div>
            <div id="epi-find-results" class="space-y-2"></div>
        </div>`;
        if (typeof mostrarModalGenerico === 'function') mostrarModalGenerico('Encontrar material', html);
        setTimeout(() => {
            const inp = document.getElementById('epi-find-input');
            if (inp) { try { inp.focus(); } catch(e){} }
            renderResultadosEncontrarMaterial(q);
        }, 80);
    };

    window.renderResultadosEncontrarMaterial = renderResultadosEncontrarMaterial;

    window.abrirRutaEncontrarMaterial = function(id){
        const lista = Array.isArray(window.inventario) ? window.inventario : (typeof inventario !== 'undefined' ? inventario : []);
        const item = lista.find(x => String(x.id) === String(id));
        if (!item) { if (typeof feedbackEpi === 'function') feedbackEpi('No se encontró el material', 'warn'); return; }

        const zona = (typeof zonaArmarioDesdeItem === 'function') ? zonaArmarioDesdeItem(item) : null;
        const tieneZona = !!(zona && zona.key && zona.key !== 'sin-asignar');
        const nombre = item.equipo || 'Material';

        // Cierra el buscador y abre el mismo plano funcional que usa el icono de ubicación.
        // Así no duplicamos lógica y el cajón/bandeja queda resaltado con el sistema que ya funciona.
        const modalBuscar = document.getElementById('modal-generico-overlay');
        if (modalBuscar) modalBuscar.remove();

        if (typeof abrirMapaArmarioItem === 'function') {
            setTimeout(function(){
                abrirMapaArmarioItem(id);
                setTimeout(function(){
                    const mapa = document.getElementById('modal-mapa-armario-overlay');
                    if (!mapa) return;
                    const panel = mapa.querySelector('.overflow-auto') || mapa.querySelector('.grow') || mapa.querySelector('div');
                    if (panel) {
                        const aviso = document.createElement('div');
                        aviso.className = 'mb-2 rounded-2xl border border-cyan-700 bg-cyan-950/80 text-cyan-100 p-3 text-xs font-bold shadow-lg';
                        aviso.innerHTML = '<i class="fa-solid fa-location-crosshairs mr-1"></i> Modo encontrar: <span class="text-white">' + (window.esc ? esc(nombre) : String(nombre)) + '</span>' + (tieneZona ? ' · zona resaltada en el plano.' : ' · sin cajón exacto asignado.');
                        panel.prepend(aviso);
                    }
                    if (!tieneZona && typeof feedbackEpi === 'function') feedbackEpi('El material no tiene cajón/bandeja exacto. Edita “Dónde exactamente”.', 'warn');
                    else if (typeof feedbackEpi === 'function') feedbackEpi('Ubicación resaltada en el plano', 'ok');
                }, 160);
            }, 80);
            return;
        }

        // Respaldo si por cualquier motivo no existe el visor del plano.
        const labels = (typeof leerNombresPlanoFurgoneta === 'function') ? leerNombresPlanoFurgoneta() : {};
        const zonaNombre = zona && zona.key && labels[zona.key] ? labels[zona.key] : (zona && zona.label ? zona.label : 'Sin zona exacta');
        const fotos = (zona && zona.key && typeof fotosZonaPlano === 'function') ? fotosZonaPlano(zona.key) : [];
        const titulo = window.esc ? esc(nombre) : String(nombre);
        const ubic = window.esc ? esc(etiquetaUbicacionFind(item)) : etiquetaUbicacionFind(item);
        const zonaNombreSafe = window.esc ? esc(zonaNombre) : zonaNombre;
        const verInteriorAccion = (fotos.length && zona && zona.key) ? `abrirFotoInteriorPlano('${zona.key}',0)` : `feedbackEpi('Sin foto interior guardada para ${zonaNombreSafe}', 'warn')`;
        const html = `<div class="space-y-3">
            <div class="rounded-2xl border border-cyan-800 bg-slate-950 p-3">
                <div class="text-[10px] uppercase tracking-wider text-cyan-400 font-black">Modo encontrar</div>
                <h3 class="text-base font-black text-slate-100 leading-tight">${titulo}</h3>
                <p class="text-[11px] text-slate-400 mt-1"><i class="fa-solid fa-location-dot text-cyan-300 mr-1"></i>${ubic}</p>
            </div>
            ${(typeof renderArmarioInteractivo === 'function') ? renderArmarioInteractivo(zona) : '<div class="text-red-300 text-xs">No está disponible el plano.</div>'}
            <div class="grid grid-cols-2 gap-2 pb-2">
                <button type="button" onclick="abrirModoEncontrarMaterial()" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl py-3 text-xs font-black"><i class="fa-solid fa-magnifying-glass mr-1"></i>Buscar otro</button>
                <button type="button" onclick="${verInteriorAccion}" class="bg-cyan-700 hover:bg-cyan-600 border border-cyan-500 text-white rounded-xl py-3 text-xs font-black"><i class="fa-solid fa-camera mr-1"></i>Ver interior</button>
            </div>
        </div>`;
        if (typeof mostrarModalGenerico === 'function') mostrarModalGenerico('Encontrar material', html);
    };
})();
