(function(){
    if (window.__epiMainScrollFinalFix) return;
    window.__epiMainScrollFinalFix = true;

    function desbloquearScrollPrincipal(){
        const html = document.documentElement;
        const body = document.body;
        if (!body) return;
        html.style.overflowY = 'auto';
        html.style.height = 'auto';
        body.style.overflowY = 'auto';
        body.style.height = 'auto';
        body.style.maxHeight = 'none';
        body.style.position = 'relative';
    }

    desbloquearScrollPrincipal();
    window.addEventListener('load', desbloquearScrollPrincipal);
    document.addEventListener('click', function(){ setTimeout(desbloquearScrollPrincipal, 60); }, true);

    // Si no hay modal abierto, ningún gesto vertical debe quedar bloqueado.
    document.addEventListener('touchmove', function(e){
        const modalAbierto = e.target && e.target.closest && e.target.closest('#modal-generico-overlay, #modal-mapa-armario-overlay, #modal-item-overlay, #modal-fotos-item-overlay, #modal-foto-overlay, #modal-dashboard-overlay, #modal-calendario-overlay, #modal-inspeccion-rapida-overlay, #sidebar-panel');
        if (!modalAbierto) {
            desbloquearScrollPrincipal();
        }
    }, {passive:true, capture:true});
})();
