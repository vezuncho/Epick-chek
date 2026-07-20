(function(){
    if (window.__epiConfigPlanoScrollFix) return;
    window.__epiConfigPlanoScrollFix = true;
    let startY = 0;
    document.addEventListener('touchstart', function(e){
        const modal = document.getElementById('modal-generico-overlay');
        if (!modal || !modal.contains(e.target) || !e.touches || !e.touches.length) return;
        startY = e.touches[0].clientY;
    }, {passive:true});
    document.addEventListener('touchmove', function(e){
        const modal = document.getElementById('modal-generico-overlay');
        if (!modal || !modal.contains(e.target) || !e.touches || !e.touches.length) return;
        const body = document.getElementById('modal-generico-body');
        if (!body) return;
        const y = e.touches[0].clientY;
        const dy = y - startY;
        const atTop = body.scrollTop <= 0;
        const atBottom = Math.ceil(body.scrollTop + body.clientHeight) >= body.scrollHeight;
        if ((atTop && dy > 0) || (atBottom && dy < 0)) {
            e.preventDefault();
        }
        e.stopPropagation();
    }, {passive:false});
})();
