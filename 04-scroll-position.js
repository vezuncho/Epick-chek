// ── Mantener posición tras editar / guardar / inspeccionar / borrar ─────
        (function(){
            const RESTORE_DELAY = [40, 180, 420];

            function cssEscapeSafe(value){
                if (window.CSS && CSS.escape) return CSS.escape(String(value));
                return String(value).replace(/"/g, '\\"');
            }

            function capturarPosicion(itemId){
                return {
                    y: window.scrollY || document.documentElement.scrollTop || 0,
                    id: itemId || '',
                    pestana: window.pestanaActual || '',
                    sub: window.sububicacionActual || '',
                    cat: window.categoriaHerramientaActual || '',
                    busqueda: (document.getElementById('search-input') || {}).value || ''
                };
            }

            function restaurarPosicion(ctx){
                if (!ctx) return;
                RESTORE_DELAY.forEach(delay => {
                    setTimeout(() => {
                        let objetivo = null;
                        if (ctx.id) {
                            objetivo = document.querySelector('[data-item-id="' + cssEscapeSafe(ctx.id) + '"]');
                        }
                        if (objetivo) {
                            const margen = 115;
                            const top = Math.max(0, objetivo.getBoundingClientRect().top + window.scrollY - margen);
                            window.scrollTo({ top, behavior: 'auto' });
                            objetivo.classList.add('epi-scroll-restored');
                            setTimeout(() => objetivo.classList.remove('epi-scroll-restored'), 900);
                        } else {
                            window.scrollTo({ top: Math.max(0, ctx.y), behavior: 'auto' });
                        }
                    }, delay);
                });
            }

            function envolver(nombre, capturar){
                const original = window[nombre];
                if (typeof original !== 'function' || original.__mantieneScroll) return;
                const fn = function(...args){
                    const ctx = capturar ? capturar.apply(this, args) : capturarPosicion(args[0]);
                    const res = original.apply(this, args);
                    restaurarPosicion(ctx);
                    return res;
                };
                fn.__mantieneScroll = true;
                window[nombre] = fn;
            }

            envolver('renovarRevision', id => capturarPosicion(id));
            envolver('eliminarMaterial', id => capturarPosicion(''));
            envolver('filtrarEstado', () => capturarPosicion(''));
            envolver('limpiarFiltros', () => capturarPosicion(''));
            envolver('seleccionarCategoriaHerramienta', () => capturarPosicion(''));
            envolver('cambiarSubpestana', () => capturarPosicion(''));
            envolver('guardarVehiculo', () => capturarPosicion(''));

            const guardarOriginal = window.guardarFormulario;
            if (typeof guardarOriginal === 'function' && !guardarOriginal.__mantieneScroll) {
                const fn = function(...args){
                    const id = (document.getElementById('form-id') || {}).value || '';
                    const ctx = capturarPosicion(id);
                    const res = guardarOriginal.apply(this, args);
                    restaurarPosicion(ctx);
                    return res;
                };
                fn.__mantieneScroll = true;
                window.guardarFormulario = fn;
            }

            const adjuntarOriginal = window.adjuntarArchivoItem;
            if (typeof adjuntarOriginal === 'function' && !adjuntarOriginal.__mantieneScroll) {
                const fn = function(id, tipo){
                    window.__epiScrollContextAdjunto = capturarPosicion(id);
                    return adjuntarOriginal.apply(this, arguments);
                };
                fn.__mantieneScroll = true;
                window.adjuntarArchivoItem = fn;
            }

            const renderOriginal = window.renderApp;
            if (typeof renderOriginal === 'function' && !renderOriginal.__mantieneScrollSuave) {
                const fn = function(...args){
                    const ctx = window.__epiScrollContextAdjunto || null;
                    const res = renderOriginal.apply(this, args);
                    if (ctx) {
                        restaurarPosicion(ctx);
                        window.__epiScrollContextAdjunto = null;
                    }
                    return res;
                };
                fn.__mantieneScrollSuave = true;
                window.renderApp = fn;
            }
        })();
