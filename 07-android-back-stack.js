(function(){
    if (window.__epiAndroidBackStackFix) return;
    window.__epiAndroidBackStackFix = true;

    const EPI_BACK_FLAG = 'epiCheckBackGuard';
    let suppressPush = false;
    let lastTab = window.pestanaActual || 'personal';
    const tabStack = [lastTab];

    function pushBackState(label){
        if (suppressPush) return;
        try {
            history.pushState({ [EPI_BACK_FLAG]: true, label: label || 'panel', t: Date.now() }, '', location.href);
        } catch(e) {}
    }

    function ensureBaseState(){
        try {
            if (!history.state || !history.state[EPI_BACK_FLAG]) {
                history.replaceState({ [EPI_BACK_FLAG]: true, label: 'base', t: Date.now() }, '', location.href);
            }
        } catch(e) {}
    }

    function visible(el){
        if (!el) return false;
        if (el.classList && el.classList.contains('hidden')) return false;
        const cs = window.getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) !== 0;
    }

    function removeById(id){
        const el = document.getElementById(id);
        if (!el) return false;
        if (el.classList && el.classList.contains('hidden')) return false;
        el.remove();
        return true;
    }

    function closeTopLayer(){
        // Menús y selectores pequeños primero
        const customMenu = document.getElementById('options-custom-select');
        if (customMenu && !customMenu.classList.contains('hidden')) {
            customMenu.classList.add('hidden');
            const arrow = document.getElementById('icon-select-arrow');
            if (arrow) arrow.classList.remove('rotate-180');
            return true;
        }

        // Modales/paneles creados dinámicamente
        if (removeById('modal-mapa-armario-overlay')) return true;
        if (removeById('modal-contextual-overlay')) return true;
        if (removeById('modal-prestamo-overlay')) return true;
        if (removeById('modal-fotos-item-overlay')) return true;
        if (removeById('modal-generico-overlay')) return true;
        if (removeById('modal-calendario-overlay')) return true;
        if (removeById('modal-dashboard-overlay')) return true;
        if (removeById('modal-inspeccion-rapida-overlay')) {
            if (window.inspeccionRapida && window.inspeccionRapida.activa) {
                window.inspeccionRapida.activa = false;
                if (typeof window.guardarEnLocalStorage === 'function') window.guardarEnLocalStorage();
            }
            return true;
        }

        // Modal formulario fijo
        const modalForm = document.getElementById('modal-overlay');
        if (visible(modalForm)) {
            if (typeof window.cerrarModalFormulario === 'function') window.cerrarModalFormulario();
            else modalForm.classList.add('hidden');
            return true;
        }

        const exportModal = document.getElementById('modal-exportar-overlay');
        if (visible(exportModal)) {
            if (typeof window.cerrarModalExportar === 'function') window.cerrarModalExportar();
            else exportModal.classList.add('hidden');
            return true;
        }

        const vehiculoModal = document.getElementById('modal-vehiculo-overlay');
        if (visible(vehiculoModal)) {
            if (typeof window.cerrarModalVehiculo === 'function') window.cerrarModalVehiculo();
            else vehiculoModal.remove();
            return true;
        }

        // Sidebar lateral / menú Más
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const sidebarOpen = sidebar && !sidebar.classList.contains('-translate-x-full');
        if (sidebarOpen || visible(sidebarOverlay)) {
            if (typeof window.toggleSidebar === 'function') window.toggleSidebar(false);
            else {
                if (sidebar) sidebar.classList.add('-translate-x-full');
                if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
            }
            return true;
        }

        return false;
    }

    function goPreviousTabOrHome(){
        const current = window.pestanaActual || lastTab || 'personal';
        while (tabStack.length > 1 && tabStack[tabStack.length - 1] === current) tabStack.pop();
        const prev = tabStack.length > 1 ? tabStack.pop() : null;
        if (prev && prev !== current && typeof window.cambiarPestana === 'function') {
            suppressPush = true;
            try { window.cambiarPestana(prev); } finally { suppressPush = false; }
            lastTab = prev;
            return true;
        }
        if (window.scrollY > 40) {
            window.scrollTo({top:0, behavior:'smooth'});
            return true;
        }
        return false;
    }

    function wrapOpen(name, label){
        const original = window[name];
        if (typeof original !== 'function' || original.__epiBackWrapped) return;
        const wrapped = function(){
            const result = original.apply(this, arguments);
            setTimeout(() => pushBackState(label || name), 0);
            return result;
        };
        wrapped.__epiBackWrapped = true;
        window[name] = wrapped;
    }

    function wrapFunctions(){
        [
            ['abrirConfiguracionPlanoFurgoneta','config-plano'],
            ['abrirMapaArmarioItem','mapa-armario'],
            ['abrirMenuContextualItem','menu-contextual'],
            ['abrirPrestamoItem','prestamo'],
            ['abrirMenuFotosItem','fotos-item'],
            ['abrirCalendarioRevisiones','calendario'],
            ['abrirDashboard','dashboard'],
            ['abrirInspeccionRapida','inspeccion'],
            ['abrirModalFormulario','formulario'],
            ['abrirModalExportar','exportar'],
            ['abrirModalVehiculo','vehiculo']
        ].forEach(x => wrapOpen(x[0], x[1]));

        const oldGeneric = window.mostrarModalGenerico;
        if (typeof oldGeneric === 'function' && !oldGeneric.__epiBackWrapped) {
            const wrappedGeneric = function(){
                const result = oldGeneric.apply(this, arguments);
                setTimeout(() => pushBackState('modal-generico'), 0);
                return result;
            };
            wrappedGeneric.__epiBackWrapped = true;
            window.mostrarModalGenerico = wrappedGeneric;
        }

        const oldToggle = window.toggleSidebar;
        if (typeof oldToggle === 'function' && !oldToggle.__epiBackWrapped) {
            const wrappedToggle = function(open){
                const result = oldToggle.apply(this, arguments);
                const sidebar = document.getElementById('sidebar');
                const isOpen = sidebar && !sidebar.classList.contains('-translate-x-full');
                if (open === true || isOpen) setTimeout(() => pushBackState('sidebar'), 0);
                return result;
            };
            wrappedToggle.__epiBackWrapped = true;
            window.toggleSidebar = wrappedToggle;
        }

        const oldTab = window.cambiarPestana;
        if (typeof oldTab === 'function' && !oldTab.__epiBackTabWrapped) {
            const wrappedTab = function(pestana){
                const before = window.pestanaActual || lastTab;
                const result = oldTab.apply(this, arguments);
                const after = pestana || window.pestanaActual;
                if (!suppressPush && after && after !== before) {
                    tabStack.push(before);
                    lastTab = after;
                    pushBackState('tab-' + after);
                }
                return result;
            };
            wrappedTab.__epiBackTabWrapped = true;
            window.cambiarPestana = wrappedTab;
        }
    }

    window.addEventListener('popstate', function(){
        const closed = closeTopLayer();
        if (!closed) goPreviousTabOrHome();
        // Dejamos siempre un estado interno para que el botón físico/flotante no saque de la app directamente.
        setTimeout(() => pushBackState('guard'), 30);
    });

    ensureBaseState();
    wrapFunctions();
    window.addEventListener('load', function(){
        ensureBaseState();
        wrapFunctions();
    });
    setTimeout(wrapFunctions, 500);
    setTimeout(wrapFunctions, 1500);
})();
