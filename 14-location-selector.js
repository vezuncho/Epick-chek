(function () {
    'use strict';
    const select = () => document.getElementById('form-donde-select');
    const libre = () => document.getElementById('form-donde-libre');
    const hidden = () => document.getElementById('form-donde');
    const ayuda = () => document.getElementById('form-donde-ayuda');
    const ubicacionActual = () => String(document.getElementById('form-ubicacion')?.value || 'personal');

    function etiquetasPlano() {
        try { return typeof leerNombresPlanoFurgoneta === 'function' ? leerNombresPlanoFurgoneta() : {}; }
        catch (_) { return {}; }
    }
    function zonasPlano() {
        try { return typeof zonasArmarioBase === 'function' ? zonasArmarioBase() : []; }
        catch (_) { return []; }
    }
    function valorCanonicoZona(zona) {
        if (!zona) return '';
        const key = String(zona.key || '');
        let m;
        if ((m = key.match(/^bandeja-(\d+)$/))) return 'Gaveta ' + m[1];
        if ((m = key.match(/^cajon-(\d+)$/))) return 'Cajón ' + m[1];
        if (key === 'inferior-10') return 'Zona 10';
        if (key === 'saco-epis') return 'Saco azul - EPIs';
        return String(zona.label || '').trim();
    }
    function poblarSelector(valorActual) {
        const el = select();
        if (!el) return;
        const labels = etiquetasPlano();
        const zonas = zonasPlano();
        const actual = String(valorActual ?? hidden()?.value ?? '').trim();
        el.innerHTML = '<option value="">Sin ubicación asignada</option>';
        zonas.forEach(function (z) {
            const value = valorCanonicoZona(z);
            if (!value) return;
            const personalizado = String(labels[z.key] || '').trim();
            const base = String(z.label || value).trim();
            const texto = personalizado && personalizado !== base ? base + ' — ' + personalizado : base;
            const op = document.createElement('option');
            op.value = value;
            op.textContent = texto;
            el.appendChild(op);
        });
        const existe = Array.from(el.options).some(function (o) { return o.value === actual; });
        if (actual && !existe) {
            const op = document.createElement('option');
            op.value = '';
            op.textContent = 'Ubicación anterior no vinculada: ' + actual;
            op.disabled = true;
            el.insertBefore(op, el.options[1] || null);
        }
        el.value = existe ? actual : '';
        if (hidden()) hidden().value = el.value;
    }
    function sincronizarControl(forzarValor) {
        const esFurgoneta = ubicacionActual() === 'furgoneta';
        const h = hidden(), s = select(), l = libre(), a = ayuda();
        if (!h || !s || !l) return;
        const valor = String(forzarValor ?? h.value ?? '').trim();
        if (esFurgoneta) {
            poblarSelector(valor);
            s.classList.remove('hidden');
            l.classList.add('hidden');
            if (a) a.classList.remove('hidden');
            h.value = s.value;
        } else {
            s.classList.add('hidden');
            l.classList.remove('hidden');
            if (a) a.classList.add('hidden');
            l.value = valor;
            h.value = l.value.trim();
        }
    }
    document.addEventListener('change', function (ev) {
        if (ev.target?.id === 'form-donde-select' && hidden()) hidden().value = ev.target.value;
        if (ev.target?.id === 'form-donde-libre' && hidden()) hidden().value = ev.target.value.trim();
    }, true);
    document.addEventListener('input', function (ev) {
        if (ev.target?.id === 'form-donde-libre' && hidden()) hidden().value = ev.target.value.trim();
    }, true);
    try {
        const originalSeleccionar = seleccionarOpcionCustom;
        seleccionarOpcionCustom = function () {
            const r = originalSeleccionar.apply(this, arguments);
            setTimeout(function () { sincronizarControl(); }, 0);
            return r;
        };
        window.seleccionarOpcionCustom = seleccionarOpcionCustom;
    } catch (_) {}
    try {
        const originalNuevo = abrirModalFormulario;
        abrirModalFormulario = function () {
            const r = originalNuevo.apply(this, arguments);
            setTimeout(function () { sincronizarControl(''); }, 0);
            return r;
        };
        window.abrirModalFormulario = abrirModalFormulario;
    } catch (_) {}
    try {
        const originalEditar = editarMaterial;
        editarMaterial = function (id) {
            const r = originalEditar.apply(this, arguments);
            setTimeout(function () { sincronizarControl(hidden()?.value || ''); }, 0);
            return r;
        };
        window.editarMaterial = editarMaterial;
    } catch (_) {}
    document.addEventListener('click', function (ev) {
        const btn = ev.target?.closest?.('button');
        if (!btn) return;
        const texto = String(btn.textContent || '').toLowerCase();
        if (btn.id === 'btn-guardar-equipo' || btn.id === 'btn-guardar-formulario' || /guardar equipo|guardar material|guardar cambios/.test(texto)) {
            if (ubicacionActual() === 'furgoneta') {
                if (hidden()) hidden().value = select()?.value || '';
            } else if (hidden()) hidden().value = libre()?.value.trim() || '';
        }
    }, true);
    document.addEventListener('DOMContentLoaded', function () { sincronizarControl(); }, { once: true });
    window.actualizarSelectorUbicacionArmario = sincronizarControl;
})();
